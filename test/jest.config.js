const path = require('path');

// <rootDir> は Jest が絶対パスへ置換するが、これらのパターンは正規表現として扱われる。
// パスに正規表現のメタ文字（.、+、( など）が含まれると意図しないマッチになるため、
// 置換に頼らず自分で組み立ててエスケープする。
// <rootDir> is substituted with an absolute path, but these patterns are treated as
// regular expressions, so a path containing regex metacharacters (., +, ( …) would match
// unintentionally. Build the pattern here and escape it instead of relying on the token.
const rootDir = path.resolve(__dirname, '..');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// 区切り文字も実行環境に合わせる（Windows では path.resolve が \ を返すため、
// / をハードコードすると .claude/worktrees 配下にマッチしなくなる）。
const sep = escapeRegExp(path.sep);
const WORKTREES_IGNORE_PATTERN = `${escapeRegExp(rootDir)}${sep}\\.claude${sep}worktrees${sep}`;
// preset（@wordpress/jest-preset-default）の testPathIgnorePatterns の既定値には
// "/node_modules/" と "<rootDir>/vendor/" が入っている。こちらで指定すると配列ごと
// 置き換わるため、composer の依存に JS のテストが混ざった時に収集されないよう明示的に含める。
// The preset's testPathIgnorePatterns default is [ "/node_modules/", "<rootDir>/vendor/" ].
// Setting the option replaces the whole array, so vendor is listed again here to keep
// Composer dependencies' JS tests from being collected.
const VENDOR_IGNORE_PATTERN = `${escapeRegExp(rootDir)}${sep}vendor${sep}`;

module.exports = {
    rootDir,
    moduleNameMapper: {
        "^@vkblocks/(.+)": "<rootDir>/src/$1",
        "\\.svg$": "<rootDir>/test/__mocks__/svgMock.js"
    },
    preset: '@wordpress/jest-preset-default',
    // .claude/worktrees 配下にはエージェント用の git worktree（このリポジトリの複製）が置かれる
    // ことがあり、放置すると同名のテストが二重に検出されて誤検知になる。testPathIgnorePatterns は
    // 既定値の "/node_modules/" を上書きするため、こちらも明示的に含める。
    // また testPathIgnorePatterns はテストの収集を止めるだけでモジュールのクロールは止まらず、
    // worktree 側の test/__mocks__ が jest-haste-map の警告を出し続けるため、
    // modulePathIgnorePatterns でモジュール解決の対象からも除外する。
    // .claude/worktrees can hold agent git worktrees (clones of this repository); left alone,
    // their copies of the same tests are collected twice and cause false failures. Setting
    // testPathIgnorePatterns replaces the "/node_modules/" default, so it is listed again.
    // It only stops test collection, not module crawling, so the worktree's test/__mocks__
    // keeps triggering jest-haste-map warnings — modulePathIgnorePatterns excludes it from
    // module resolution as well.
    // node_modules も rootDir に依存しない相対パターンのまま、区切り文字だけ実行環境に合わせる
    // （Windows では "/node_modules/" が一致しない）。
    // Keep the node_modules pattern independent of rootDir, but use the platform separator
    // ("/node_modules/" does not match on Windows).
    testPathIgnorePatterns: [`${sep}node_modules${sep}`, VENDOR_IGNORE_PATTERN, WORKTREES_IGNORE_PATTERN],
    modulePathIgnorePatterns: [WORKTREES_IGNORE_PATTERN],
    transform: {
        "^.+\\.(js|jsx|mjs|cjs|ts|tsx)$": "babel-jest",
        ".+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$": "jest-transform-stub"
    },
    transformIgnorePatterns: [
        // ここでは `swiper` と `uuid` をトランスパイルから除外するモジュールのリストから除外しています。
        // 注意: この正規表現は `/node_modules/` 内のモジュール名が `swiper` もしくは `uuid` であるものをトランスパイルの対象に含めるようにしています。
        // 他のモジュールをトランスパイルから除外したい場合は、このリストを適宜更新してください。
        "/node_modules/(?!swiper|uuid)/.+\\.js$"
    ],
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"]
};
