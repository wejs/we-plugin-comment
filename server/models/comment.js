/**
 * Comment Model
 *
 * @module      :: Model
 * @description :: Comment model
 *
 */

module.exports = function Model(we) {
  // set sequelize model define and options
  var model = {
    definition: {
      body: {
        type: we.db.Sequelize.TEXT,
        allowNull: false,
        formFieldType: 'html',
        formFieldFocus: true
      },

      published: {
        type: we.db.Sequelize.BOOLEAN,
        defaultValue: true,
        formFieldType: null
      },

      modelName: {
        type: we.db.Sequelize.STRING,
        allowNull: false,
        formFieldType: 'hidden'
      },

      modelId: {
        type: we.db.Sequelize.INTEGER,
        allowNull: false,
        formFieldType: 'hidden'
      }
    },

    associations: {
      creator: {
        type: 'belongsTo',
        model: 'user',
        allowNull: false
      }
    },

    options: {
      classMethods: {
        getLastestCommentsAndCount: function getLastestCommentsAndCount(modelId, modelName, done) {
          we.db.models.comment.count({
            where: {
              modelId: modelId,
              modelName: modelName
            }
          }).then(function (count){
            we.db.models.comment.findAll({
              where: {
                modelName: modelName,
                modelId: modelId
              },
              limit: we.config.latestCommentLimit,
              order: [
                ['id',  'desc']
              ],
              include: [{model: we.db.models.user, as: 'creator'}]
            }).then(function (comments) {
              done(null, { comments: comments, count: count })
            }).catch(done);
          }).catch(done);
        }
      },
      instanceMethods: {},
      hooks: {
        validate: function(record, options, next) {
          if( !we.db.models[record.modelName] ) return next('modelName.required');
          we.db.models[record.modelName].findById(record.modelId)
          .then(function (commentedRecord) {
            if(!commentedRecord) return next('modelId.required');
            return next();
          }).catch(next);
        }
      }
    }
  }

  return model;
}
