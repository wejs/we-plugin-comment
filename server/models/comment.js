/**
 * Comment Model
 *
 * @module      :: Model
 * @description :: Comment model
 *
 */

module.exports = function Model(we) {
  // set sequelize model define and options
  const model = {
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
        getLastestCommentsAndCount(modelId, modelName, done) {
          we.db.models.comment
          .count({
            where: {
              modelId: modelId,
              modelName: modelName
            }
          })
          .then( (count)=> {
            return we.db.models.comment
            .findAll({
              where: {
                modelName: modelName,
                modelId: modelId
              },
              limit: we.config.latestCommentLimit,
              order: [
                ['id',  'desc']
              ],
              include: [{model: we.db.models.user, as: 'creator', attributes: ['id', 'displayName']}]
            })
            .then( (comments)=> {
              done(null, { comments: comments, count: count })
              return null;
            });
          })
          .catch(done);
        }
      },
      instanceMethods: {},
      hooks: {
        beforeValidate(record) {
          return new Promise( (resolve, reject)=> {
            if( !we.db.models[record.modelName] ) {
              return reject('modelName.required');
            }

            we.db.models[record.modelName]
            .findById(record.modelId)
            .then( (commentedRecord)=> {
              if(!commentedRecord) {
                reject('modelId.required');
              } else {
                resolve();
              }
              return null;
            })
            .catch(reject);
          });
        }
      }
    }
  }

  return model;
}
