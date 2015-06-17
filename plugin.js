
module.exports = function loadPlugin(projectPath, Plugin) {
  var plugin = new Plugin(__dirname);
  // set plugin configs
  plugin.setConfigs({
    defaultCommentLimit: 3,
    permissions: {
      'find_comment': {
        'group': 'comment',
        'title': 'Find comments',
        'description': 'Find and find all comments'
      },
      'create_comment': {
        'group': 'comment',
        'title': 'Create one comment',
        'description': 'Create one new comment'
      },
      'update_comment': {
        'group': 'comment',
        'title': 'Update one comment',
        'description': 'Update one new comment'
      },
      'delete_comment': {
        'group': 'comment',
        'title': 'Delete one comment',
        'description': 'Delete one comment record'
      },
    }
  });

  plugin.setRoutes({
    // Comment
    'get /comment/:id([0-9]+)': {
      controller    : 'comment',
      action        : 'findOne',
      model         : 'comment',
      permission    : 'find_comment'
    },
    'get /comment': {
      controller    : 'comment',
      action        : 'find',
      model         : 'comment',
      permission    : 'find_comment'
    },
    'post /comment': {
      controller    : 'comment',
      action        : 'create',
      model         : 'comment',
      permission    : 'create_comment'
    },
    'put /comment/:id([0-9]+)': {
      controller    : 'comment',
      action        : 'update',
      model         : 'comment',
      permission    : 'update_comment'
    },
    'delete /comment/:id([0-9]+)': {
      controller    : 'comment',
      action        : 'destroy',
      model         : 'comment',
      permission    : 'delete_comment'
    }
  });

  return plugin;
};