module.exports = function loadPlugin(projectPath, Plugin) {
  const plugin = new Plugin(__dirname);
  // set plugin configs
  plugin.setConfigs({
    latestCommentLimit: 3,
    comments: {
      models:  {
        post: true,
        article: true,
        cfnews: true
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
      template: 'comment/commentForm'
    }
  });

  // use this hook in one we.js plugin to change a res.ok response
  plugin.hooks.on('we:before:send:okResponse', (data, done)=> {
    // {
    //   req: req,
    //   res: res,
    //   data: data
    // }

    if (!data.res.locals.data || !data.res.locals.model) return done();

    const modelName = data.res.locals.model;
    const functions = [];
    const req = data.req;
    let records, record, userId;
    let Comment = req.we.db.models.comment;

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
        functions.push( (done)=> {
          // load comments and count for evety record
          data.req.we.utils.async.each(records, (record, next)=> {
            if (!record.metadata) record.metadata = {};

           Comment.getLastestCommentsAndCount(record.id, modelName, (err, result)=> {
             if (err) return next(err);
             record.metadata.comments = result.comments;
             record.metadata.commentsCount = result.count;
             next();
           });
          }, done);
        });

      } else if (record) {
        functions.push( (done)=> {
          if (!record.metadata) record.metadata = {};
          Comment.getLastestCommentsAndCount(record.id, modelName, (err, result)=> {
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

  // this evnet only run if we-plugin-socketio is instaled in your project
  plugin.events.on('we:after:load:socket.io', (opts)=> {
    // opts: { we: we, server: server }
    const we = opts.we;

    we.io.on('connection', (socket)=> {
      socket.on('comment:subscribe', (data)=> {
        if (!data.modelName || !data.modelId) {
          we.log.warn('we-plugin-comment: comment:subscribe: modelName and modelId is required');
          // invalid request
          return;
        }

        // join room to receive updates
        let roomName = 'comment:'+data.modelName+':'+data.modelId;
        socket.join(roomName);

        we.log.verbose('we-plugin-comment: comment:subscribe: user joined room: '+roomName);
      });
    });
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