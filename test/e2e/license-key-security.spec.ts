import { test, expect } from '@wordpress/e2e-test-utils-playwright'

// Issue: https://github.com/vektor-inc/vk-blocks-pro/issues/2657
test.describe('Security', () => {
  test.describe.configure({ mode: 'parallel', retries: 0 })

  test.beforeEach(async ({ admin, page }) => {
    await admin.visitAdminPage('options-permalink.php')
    await page.getByText('Post name').click()
    await page.getByRole('button', { name: 'Save Changes' }).click()
  })

  const groupSize = 6 // 環境変数から取得する場合は process.env.LK_GROUP_SIZE を使用
  const makeGroups = (items: string[], size: number) => {
    const groups: string[][] = []
    for (let i = 0; i < items.length; i += size) groups.push(items.slice(i, i + size))
    return groups
  }

  const getVkBlocksForTest = async (page: any) => {
    const skip = new Set([
      'vk-blocks/accordion-target','vk-blocks/accordion-trigger',
      'vk-blocks/gridcolcard-item','vk-blocks/gridcolcard-item-body',
      'vk-blocks/gridcolcard-item-footer','vk-blocks/gridcolcard-item-header',
      'vk-blocks/step-item','vk-blocks/tab-item','vk-blocks/timeline-item',
      'vk-blocks/slider-item','vk-blocks/select-post-list-item',
      'vk-blocks/blog-card-excerpt','vk-blocks/blog-card-featured-image',
      'vk-blocks/blog-card-site-logo','vk-blocks/blog-card-site-title','vk-blocks/blog-card-title',
      'vk-blocks/icon-card-item'
    ])
    await page.waitForFunction(() => (window as any)?.wp?.blocks?.getBlockTypes, { timeout: 30000 })
    const all = await page.evaluate(() => (window as any).wp.blocks.getBlockTypes().map((b: any) => b.name))
    return all.filter((n: string) => n.startsWith('vk-blocks/')).filter((n: string) => !skip.has(n))
  }

  // 公開後にフロントの閲覧ページへ確実に移動するユーティリティ
  const gotoFrontendFromEditor = async (page: any) => {
    const currentUrl: string = page.url()
    if (!currentUrl.includes('/wp-admin/')) return currentUrl
    const viewLabel = /View (post|page)|投稿を表示|ページを表示/i
    for (const role of ['link','button']) {
      const el = page.getByRole(role as any, { name: viewLabel })
      if (await el.count().then(c => c > 0)) {
        await el.first().click()
        await page.waitForLoadState('load')
        await page.waitForSelector('body')
        if (!page.url().includes('/wp-admin/')) return page.url()
      }
    }
    try {
      const url = new URL(currentUrl)
      const postId = url.searchParams.get('post')
      if (postId) {
        const permUrl = `/?p=${postId}`
        await page.goto(permUrl)
        await page.waitForSelector('body')
        if (!page.url().includes('/wp-admin/')) return page.url()
      }
    } catch {}
    try {
      const frontUrl = await page.evaluate(async () => {
        // @ts-ignore
        const id = window?.wp?.data?.select('core/editor')?.getCurrentPostId?.()
        if (!id) return null
        try {
          const res = await fetch(`/wp-json/wp/v2/posts/${id}`, { credentials: 'include' })
          if (res.ok) {
            const data = await res.json()
            if (data && data.link) return data.link as string
          }
        } catch {}
        return `/?p=${id}`
      })
      if (frontUrl) {
        await page.goto(frontUrl)
        await page.waitForSelector('body')
        if (!page.url().includes('/wp-admin/')) return page.url()
      }
    } catch {}
    return currentUrl
  }

  const saveAndPublish = async (page: any) => {
    await page.waitForFunction(() => (window as any)?.wp?.data, { timeout: 30000 })
    await page.evaluate(async () => {
      // @ts-ignore
      const d = window?.wp?.data?.dispatch('core/editor')
      // @ts-ignore
      const s = window?.wp?.data?.select('core/editor')
      if (d?.editPost) d.editPost({ status: 'publish' })
      if (d?.savePost) await d.savePost()
      const waitUntil = async (cond: () => boolean, timeout = 15000) => {
        const start = Date.now()
        while (!cond()) {
          await new Promise(r => setTimeout(r, 100))
          if (Date.now() - start > timeout) break
        }
      }
      await waitUntil(() => {
        try { return !s?.isSavingPost?.() && !s?.isAutosavingPost?.() } catch { return true }
      })
    })
    try {
      const id = await page.evaluate(() => {
        // @ts-ignore
        return window?.wp?.data?.select('core/editor')?.getCurrentPostId?.() || null
      })
      return id
    } catch {
      return null
    }
  }

  const collectExposure = async (page: any) => {
    const res = await page.evaluate((marker) => {
      const ids: string[] = []
      document.querySelectorAll('script[id$="-extra"]').forEach((el) => {
        const t = el.textContent || ''
        if (t.includes(marker)) ids.push(el.id)
      })
      return { ids }
    }, 'vk_blocks_pro_license_key')
    const guessed: string[] = []
    for (const id of res.ids) {
      const base = id
        .replace(/-script-js-extra$/, '')
        .replace(/-view-js-extra$/, '')
        .replace(/-js-extra$/, '')
      if (base.startsWith('vk-blocks-') && !base.includes('/')) guessed.push(base.replace(/^vk-blocks-/, 'vk-blocks/'))
      else if (base.startsWith('vk-blocks/')) guessed.push(base)
    }
    return { ids: res.ids, guessed }
  }

  test('All vk-blocks should not expose license key', async ({ admin, editor, page }) => {
    // 動的にブロック一覧を取得
    await admin.createNewPost()
    await page.waitForFunction(() => (window as any)?.wp?.blocks && (window as any)?.wp?.data, { timeout: 30000 })
    const testBlocks = await getVkBlocksForTest(page)

    // グループ化して一括検査（既存ロジックを流用）
    const groups = makeGroups(testBlocks, groupSize)
    for (let idx = 0; idx < groups.length; idx++) {
      const group = groups[idx]

      await admin.createNewPost()
      await page.waitForFunction(() => (window as any)?.wp?.blocks && (window as any)?.wp?.data, { timeout: 30000 })
      try { await page.waitForSelector('[name="editor-canvas"]', { timeout: 10000 }) } catch {}
      for (const name of group) await editor.insertBlock({ name })

      const postId = await saveAndPublish(page)
      if (postId) { try { await page.goto(`/?p=${postId}`) } catch {} } else { await gotoFrontendFromEditor(page) }
      await page.waitForSelector('body')

      const html = await page.content()
      const exposed = html.includes('vk_blocks_pro_license_key')
      if (!exposed) continue

      // 露出があれば既存の詳細特定ロジックをそのまま使用
      const offenders: string[] = []
      for (const name of group) {
        await admin.createNewPost()
        await page.waitForFunction(() => (window as any)?.wp?.blocks && (window as any)?.wp?.data, { timeout: 30000 })
        try { await page.waitForSelector('[name="editor-canvas"]', { timeout: 10000 }) } catch {}
        await editor.insertBlock({ name })
        const id = await saveAndPublish(page)
        if (id) { try { await page.goto(`/?p=${id}`) } catch {} } else { await gotoFrontendFromEditor(page) }
        await page.waitForSelector('body')
        const h = await page.content()
        if (h.includes('vk_blocks_pro_license_key')) {
          offenders.push(name)
          const det = await collectExposure(page)
          for (const hid of det.ids) {
            const base = hid
              .replace(/-script-js-extra$/, '')
              .replace(/-view-js-extra$/, '')
              .replace(/-js-extra$/, '')
            const guess = base.startsWith('vk-blocks-') && !base.includes('/')
              ? base.replace(/^vk-blocks-/, 'vk-blocks/')
              : base.startsWith('vk-blocks/')
                ? base
                : ''
            // eslint-disable-next-line no-console
            console.log(guess ? `- handle: ${hid} → block: ${guess}` : `- handle: ${hid}`)
          }
          // eslint-disable-next-line no-console
          console.log(`[License] Offender: ${name}`)
        }
      }

      if (offenders.length) {
        // eslint-disable-next-line no-console
        console.log(`[License] Exposed by blocks (group ${idx + 1}): ${offenders.join(', ')}`)
      }
      expect(offenders.length).toBe(0)
    }
  })
})
