/**
 * Alert block type
 *
 */
const { registerBlockType } = wp.blocks;
const { RichText }          = wp.editor;

registerBlockType( 'vk-block/alert', {

  title: 'Alert',

  icon: 'info',

  category: 'formatting',

  attributes: {
    style: {
      type: 'string',
      default: 'info',
    },
    content: {
      type: 'array',
      source: 'children',
      selector: 'p',
    }
  },

  edit({attributes, setAttributes}) {

    function onStyleChange(event){
      setAttributes({style: event.target.value});
    }

    function onChangeContent(newContent) {
      setAttributes({content: newContent});
    }

    return (
      <div className={`alert alert-${attributes.style}`}>
        <select onChange={onStyleChange}>
          <option value={'success'} selected={attributes.style == 'success'}>Success</option>
          <option value={'info'} selected={attributes.style == 'info'}>Info</option>
          <option value={'warning'} selected={attributes.style == 'warning'}>Warning</option>
          <option value={'danger'} selected={attributes.style == 'danger'}>Danger</option>
        </select>
        <RichText
          tagName="p"
          onChange={ onChangeContent }
          value={ attributes.content }
        />
      </div>
    );
  },

  save({attributes}) {
    return (
      <div className={`alert alert-${attributes.style}`}>
        <RichText.Content
          tagName={'p'}
          value={attributes.content}/>
      </div>
    );
  },

} );
