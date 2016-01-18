
module.exports = function loadPlugin(projectPath, Plugin) {
  var plugin = new Plugin(__dirname);
  // set plugin configs
  plugin.setConfigs({
    latestCommentLimit: 3,
    comments: {
      models:  {
       post: true,
       article: true
     }
    }
  });

  plugin.setResource({
    name: 'comment'
  });

  plugin.setRoutes({
    'get /comment-form/:modelName/:modelId': {
      controller: 'comment',
      action: 'getCommentForm',
      template: 'comment/commentForm',
      responseType: 'modal'
    }
  });

  // use this hook in one we.js plugin to change a res.ok response
  plugin.hooks.on('we:before:send:okResponse', function (data, done) {
    // {
    //   req: req,
    //   res: res,
    //   data: data
    // }

    if (!data.res.locals.data || !data.res.locals.model) return done();

    var modelName = data.res.locals.model;
    var functions = [];
    var req = data.req;
    var records, record;
    var Comment = req.we.db.models.comment;
    var userId;


    if (plugin.modelHaveComments(req.we, modelName)) {
      if (req.user) {
        userId = req.user.id
      } else {
        userId = null
      }

      if (req.we.utils._.isArray(data.res.locals.data)) {
        records = data.res.locals.data;
      } else {
        record = data.res.locals.data;
      }

      if (records) {
        functions.push( function (done) {
          // load comments and count for evety record
          data.req.we.utils.async.each(records, function (record, next) {
            if (!record.metadata) record.metadata = {};

           Comment.getLastestCommentsAndCount(record.id, modelName, function (err, result) {
             if (err) return next(err);
             record.metadata.comments = result.comments;
             record.metadata.commentsCount = result.count;
             next();
           });
          }, done);
        });

      } else if (record) {
        functions.push( function (done) {
          if (!record.metadata) record.metadata = {};
          Comment.getLastestCommentsAndCount(record.id, modelName, function (err, result) {
            if (err) return done(err);
             record.metadata.comments = result.comments;
             record.metadata.commentsCount = result.count;
            done();
          });
        });
      }
    }

    data.req.we.utils.async.series(functions, done);
  });

  plugin.modelHaveComments = function modelHaveComments(we, modelName) {
    // TODO
    return true;
  };

  plugin.addCss('comment', {
    weight: 8, pluginName: 'we-plugin-comment',
    path: 'files/public/comment.css'
  });

  plugin.addJs('comment', {
    weight: 15, pluginName: 'we-plugin-comment',
    path: 'files/public/comment.js'
  });
  return plugin;
};