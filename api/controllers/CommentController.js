/**
 * CommentController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */
var util = require('util');
var actionUtil = require('we-helpers').actionUtil;
var _ = require('lodash');

//var WN = require( process.cwd() + '/node_modules/we-plugin-notification');

module.exports = {
  create: function (req, res) {
    if(!req.isAuthenticated()) return req.forbidden();

    var sails = req._sails;
    var Model = sails.models.comment;

    var comment = {};
    comment.body = req.param('body');
    comment.creator = req.user.id;

    comment.modelName = req.param('modelName');
    comment.modelId = req.param('modelId');

    Model.create(comment).exec(function(err, newInstance) {
      if (err) {
        sails.log.error('Error on create comment', err);
        return res.negotiate(err);
      }

      if ( req._sails.hooks.pubsub && req.isSocket ) {
        // If we have the pubsub hook, use the model class's publish method
        // to notify all subscribers about the created item
        Model.publishCreate(newInstance.toJSON(), req);

      }

      // TODO
      //WN.notify('comment', 'created', newInstance, req.user);

      res.ok(newInstance);
    });
  },
  findOne: function (req, res) {
    var sails = req._sails;
    var Model = sails.models.comment;
    var pk = actionUtil.requirePk(req);

    var query = Model.findOneById(pk);
    //query = actionUtil.populateEach(query, req.options);
    query.exec(function found(err, matchingRecord) {
      if (err) {
        sails.log.error('CommentController:findOne', err);
        return res.serverError(err);
      }
      if(!matchingRecord) return res.notFound('No record found with the specified `id`.');

      res.ok(matchingRecord);
    });
  },

  find: function findRecords (req, res) {
    var sails = req._sails;
    // Look up the model
    var Model = sails.models.comment;
    res.locals.metadata = {};

    // Lookup for records that match the specified criteria
    var query = Model.find()
    .where( req.context.where )
    .limit( actionUtil.parseLimit(req) )
    .skip( actionUtil.parseSkip(req) )
    .sort( actionUtil.parseSort(req) );
    // TODO: .populateEach(req.options);
    //query = actionUtil.populateEach(query, req.options);
    return query.exec(function found(err, matchingRecords) {
      if (err) {
        sails.log.error('Error on find comment', err);
        return res.serverError(err);
      }

      Model.count()
      .where( req.context.where )
      .exec(function(err, count){
        if (err) {
          sails.log.error('Error on get comments count', err);
          return res.serverError(err);
        }

        res.locals.metadata.count = count;

        // Only `.watch()` for new instances of the model if
        // `autoWatch` is enabled.
        if (req._sails.hooks.pubsub && req.isSocket) {
          Model.subscribe(req, matchingRecords);
          if (req.options.autoWatch) {
            Model.watch(req);
          }
          // Also subscribe to instances of all associated models
          _.each(matchingRecords, function (record) {
            actionUtil.subscribeDeep(req, record);
          });
        }

        return res.ok(matchingRecords);

      })

    })
  },

  update: function updateOneRecord (req, res) {

    var sails = req._sails;
    var Model = sails.models.comment;
    // Locate and validate the required `id` parameter.
    var pk = actionUtil.requirePk(req);

    if (!req.context.record) return res.notFound(pk);

    // Create `values` object (monolithic combination of all parameters)
    // But omit the blacklisted params (like JSONP callback param, etc.)
    var values = actionUtil.parseValues(req);

    // Omit the path parameter `id` from values, unless it was explicitly defined
    // elsewhere (body/query):
    var idParamExplicitlyIncluded = ((req.body && req.body.id) || req.query.id);
    if (!idParamExplicitlyIncluded) delete values.id;

    delete values.createdAt;
    delete values.updatedAt;

    // Find and update the targeted record.
    //
    // (Note: this could be achieved in a single query, but a separate `findOne`
    //  is used first to provide a better experience for front-end developers
    //  integrating with the blueprint API.)
    return Model.findOne(pk).populateAll().exec(function found(err, matchingRecord) {

      if (err) {
        sails.log.error('CommentController:update', err);
        return res.serverError(err);
      }
      if (!matchingRecord) return res.notFound();

      return Model.update(pk, values).exec(function updated(err, records) {

        // Differentiate between waterline-originated validation errors
        // and serious underlying issues. Respond with badRequest if a
        // validation error is encountered, w/ validation info.
        if (err) return res.negotiate(err);


        // Because this should only update a single record and update
        // returns an array, just use the first item.  If more than one
        // record was returned, something is amiss.
        if (!records || !records.length || records.length > 1) {
          req._sails.log.warn(
          util.format('Unexpected output from `%s.update`.', Model.globalId)
          );
        }

        var updatedRecord = records[0];

        if (req._sails.hooks.pubsub) {
          if (req.isSocket) {
            Model.subscribe(req, records);
          }

          Model.publishUpdate(
            pk,
            _.cloneDeep(updatedRecord),
            !req.options.mirror && req,
            {
              previous: matchingRecord.toJSON()
            }
          );
        }


        return res.ok(matchingRecord);
      });// </updated>
    }); // </found>
  },

  destroy: function destroyOneRecord (req, res) {
    var sails = req._sails;
    var Model = sails.models.comment;

    var pk = actionUtil.requirePk(req);

    var query = Model.findOne(pk);
    query = actionUtil.populateEach(query, req);
    query.exec(function foundRecord (err, record) {
      if (err) return res.serverError(err);
      if(!record) return res.notFound('No record found with the specified `id`.');

      return Model.destroy(pk).exec(function destroyedRecord (err) {
        if (err) return res.negotiate(err);

        if (sails.hooks.pubsub) {
          Model.publishDestroy(pk, !sails.config.blueprints.mirror && req, {previous: record});
          if (req.isSocket) {
            Model.unsubscribe(req, record);
            Model.retire(record);
          }
        }

        return res.ok(record);
      });
    });
  }

};
