const notifications = {
  notify(req, res, comment, creator, next) {
    if (!next) next = function(){};

    if (
      !req.we.plugins['we-plugin-notification'] ||
      !req.we.plugins['we-plugin-flag'] ||
      !res.locals.data
    ) {
      return next();
    }

    const we = req.we;

    let followers = [];
    let commentedRecord;

    we.utils.async.series([
      function getFollowers(done) {
        if (!req.isAuthenticated()) {
          return done();
        }

        let where = {
          model: comment.modelName,
          modelId: comment.modelId
        };

        // get followers
        we.db.models.follow
        .findAll({
          where: where,
          attributes: ['userId']
        })
        .then( (r)=> {
          followers = r;
          done();
        })
        .catch(done);
      },

      function getCommentedRecord(done) {
        if (!we.db.models[comment.modelName]) {
          return done();
        }

        we.db.models[comment.modelName]
        .findById(comment.modelId)
        .then( (r)=> {
          commentedRecord = r;
          done();
        })
        .catch(done);
      }
    ], (err)=> {
      if (err) return next(err);
      // skip if not find the commented record:
      if (!commentedRecord) return next();
      const Model = we.db.models[comment.modelName];

      if (!Model.options || !Model.options.titleField) {
        return next();
      }

      let title = commentedRecord[Model.options.titleField];
      if (!title && commentedRecord.body) {

        title = we.utils.stripTagsAndTruncate(commentedRecord.body, 27);
      }

      if (!title) {
        title = comment.modelName +' #'+comment.modelId;
      }

      res.locals.usersNotified = {};

      req.we.utils.async.eachSeries(followers, (follower, next)=> {
        this.create(follower, commentedRecord, title, req, res, comment, creator, next);
      }, next);

      return null;
    });
  },
  create(follower, commentedRecord, title, req, res, record, creator, done) {
    if (!done) done = function(){};

    if (res.locals.usersNotified[follower.userId]) {
      return done();
    }

    const actor = req.user,
      hostname = req.we.config.hostname;

    let localeText = 'comment.'+record.modelName+'.create.notification.title';
    // after create register one notifications
    req.we.db.models.notification
    .create({
      locale: res.locals.locale,
      title: res.locals.__(localeText, {
        actorURL: hostname+'/user/'+actor.id,
        recordURL: hostname+'/'+record.modelName+'/'+record.id,
        hostname: hostname,
        actor: actor,
        title: title,
        record: record
      }),
      text: record.teaser,
      redirectUrl: '/comment/'+record.id,
      userId: follower.userId,
      actorId: actor.id,
      modelName: record.modelName,
      modelId: record.id,
      type: 'comment-created'
    })
    .then( (r)=> {
      res.locals.usersNotified[follower.userId] = true;
      req.we.log.verbose('New comment notification, id: ', r.id);
      return done(null, r);
    })
    .catch(done);
  }
};

module.exports = notifications;