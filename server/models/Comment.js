/**
 * Comment
 *
 * @module      :: Model
 * @description :: Model comentary
 *
 */

var S = require('string');
var defaultCommentLimit = 4;
var _ = require('lodash');

module.exports = {
  schema: true,
  attributes: {
    // comment creator
    creator: {
      model: 'user'
    },

    // active or disable, like published or unpublished
    active: {
      type: 'boolean',
      defaultsTo: true
    },

    // comment text
    body: {
      type: 'text',
      required: true
    },

    // comment text without tags
    bodyClean: {
      type: 'text'
    },

    // body small body text version or description
    bodyTeaser: {
      type: 'text'
    },

    modelName: {
      type: 'string',
      required: true
    },

    modelId: {
      type: 'string',
      required: true
    },

    // comment parent, to replay one specific comment
    /*
    replyTo: {
      model:'comment',
      defaultsTo: null
    },

    // comment parent, to replay one specific comment
    replys: {
      collection: 'comment',
      via: 'replyTo'
    },
    */
    // Override toJSON instance method
    toJSON: function() {
      // remove password
      var obj = this.toObject();

      // set postId for help with ember data async load
      if(  _.isObject(obj.post) && obj.post.id ) {
        obj.postId = obj.post.id;
      } else if( obj.post ) {
        obj.postId = obj.post;
      }

      // set url for this content
      obj.url = '/comment/' + obj.id;

      return obj;
    }
  },

  //-- Lifecycle Callbacks

  beforeCreate: function(record, next) {
    var originalBody = record.body;
    // sanitize
    SanitizeHtmlService.sanitizeAllAttr(record);
    // save a boy version without all tags
    record.bodyClean = S(originalBody).stripTags().s;
    // small teaser text
    record.bodyTeaser = record.bodyClean.substr(0, 100);
    next();
  },

  beforeUpdate: function(record, next) {
    var originalBody = record.body;
    // sanitize
    SanitizeHtmlService.sanitizeAllAttr(record);
    // save a boy version without all tags
    record.bodyClean = S(originalBody).stripTags().s;
    // small teaser text
    record.bodyTeaser = record.bodyClean.substr(0, 100);
    next();
  },

  // After create, register one activity
  afterCreate: function(comment, next) {
    // register one activity on create
    Activity.create({
      actor: comment.creator.id,
      verb: 'comment',
      comment: comment.id,
      post: comment.post
    }).exec(function(error, activity) {
      // if has one error in activity creation, log it
      if (error) {
        sails.log.error('CommentModel:create: error on create Activity: ',error);
      }

      next();
    });
  },

  // methods
  getCommentsAndCount: function(postId, callback){
    Comment.count()
    .where({
      post: postId
    }).exec(function(err, commentCount){
      if (err) return callback(err);

      Comment.find()
      .sort('updatedAt DESC')
      .limit(defaultCommentLimit)
      .where({
        post: postId
      }).exec(function(err, comments){
        if (err) return callback(err);

        return callback(null, comments, commentCount);
      });
    });
  }
};
