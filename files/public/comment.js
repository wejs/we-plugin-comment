/**
 * We.js client side lib
 */

(function (we) {

we.comment = {
  showForm: function(modelName, modelId, event) {
    var commentButton = $(event.target);
    var commentedRecord = $('#comment-'+modelName+'-'+modelId);
    var commentFormArea = commentButton.parent().children('.comment-form');
    var loading = commentButton.parent().children('.loading-comment-form');

    commentButton.hide();
    loading.show();

    var url = '/comment-form/'+ modelName +'/'+ modelId;
    url += '?redirectTo='+location.pathname+ '&contentOnly=true';

    $.ajax({ url: url })
    .then(function (result) {
      commentFormArea.show();
      // overryde default on submit
      var form = $(result);
      form.on('submit', we.comment.onSubmitForm.bind({
        form: form,
        commentFormArea: commentFormArea,
        commentButton: commentButton,
        commentedRecord: commentedRecord
      }));

      form.find('a[data-we-actiontype="cancel"]').on('click', we.comment.close.bind({
        form: form,
        commentFormArea: commentFormArea,
        commentButton: commentButton,
        commentedRecord: commentedRecord
      }));

      // add form in html
      commentFormArea.html(form);

      // focus the text area if the editor is tinyMCE:
      if (window.tinyMCE) {
        window.tinyMCE.EditorManager.get(form.find('textarea').attr('id')).focus();
      }
    }).fail(function (err) {
      loading.hide();
      console.error('error in get comment form:', err);
    });
  },
  close: function close(event) {
    event.preventDefault();

    // remove form from html
    this.form.remove();
    // show commentButton  or label
    this.commentButton.show();

    if (window.tinyMCE) {

    } else {
      this.form.destroy();
    }

    // scroll to comment
    $(document.body).scrollTop(this.commentButton.offset().top);

    return false;
  },
  onSubmitForm: function onSubmitForm (event) {
    event.preventDefault();


    var self = this;
    var $sumary = $(event.target).parent().parent().find('.comments-sumary');

    var form = this.form;
    var formData = {};
    form.serializeArray().forEach(function (d) {
      formData[d.name] = d.value;
    });

    if (window.tinyMCE) {
      formData.body = window.tinyMCE.activeEditor.getContent();
    }

    var url = form.attr('action');

    $.ajax({
      url: url + '?contentOnly=true',
      method: 'POST',
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify(formData),
      processData: false
    })
    .then(function (r) {
      // remove and close the form
      we.comment.close.bind(self)(event);

      // get comment id
      var html = $.parseHTML(r);
      var id = html[0].id;
      formData.id = id.replace('comment-', '');

      increaceCount($sumary);

      // render the comment
      we.comment.renderComment(formData, html);
    })
    .fail(function (err) {
      // TODO!
      console.error('Error on create comment:', err);
    });

    return false;
  },

  renderComment: function renderComment(record, html) {
    // check if this comment already are in html
    var comment = $('#comment-'+record.id);
    if (comment && comment.length) {
      comment.replaceWith(html);
    } else {
      // get comment area
      var commentArea = $('#comment-'+record.modelName+ '-' + record.modelId);
      if (commentArea && commentArea.length) {
        // then append the new comment
        commentArea.children('.comments').prepend(html);
      }
    }
  },

  showAll: function(modelName, modelId) {
    var commentsBlockArea = $('#comment-'+modelName +'-'+modelId);
    commentsBlockArea.find('.show-more-comments-link').remove();
    var commentsList = commentsBlockArea.find('.comments');
    we.comment.getComments(commentsList);
  },

  getNewComments: function getNewComments(modelName, modelId) {
    var self = this;
    var $area = $('#comment-'+modelName +'-'+modelId);
    // var $sumary = $area.find('.comments-sumary');
    // var $total = $sumary.find('.total');
    var $list = $area.find('.comments');
    var $size = $list.parent().find('.comments-sumary .size');

    // var initialCount = $list.children('.comment-teaser').length

    var url = $list.attr('data-comments-url');
    $.ajax({
      url: url + '&page=1',
      method: 'GET',
      // contentType: 'application/json; charset=utf-8',
      data: {
        responseType: 'modal',
        contentOnly: true,
        teaserList: true,
        since: self.pubSub.lastCommentDate,
        redirectTo: window.location.pathname
      },
      // processData: false
    })
    .then(function (r) {
      // should but dont got more, skip
      if (!r) return null;

      $list.prepend(r);

      // var newItemsCount = $list.children('.comment-teaser').length - initialCount;

      // $total.text( Number($total.text()) + Number(newItemsCount) );
      $size.text($list.children('.comment-teaser').length);
    })
    .always(function () {

      self.pubSub.haveNewCommnets = false;
      self.pubSub.lastCommentDate = new Date().toISOString();

      $area.find('.comments-sumary-have-new').hide();
      $area.find('.cshn-count').text(0);
    })
    .fail(function (err) {
      console.error('Error on get comments:', err);
    });
  },

  getComments: function(commentsList) {
    var url = commentsList.attr('data-comments-url');
    var page = commentsList.attr('data-comments-page');

    $.ajax({
      url: url + '&page=' + page,
      method: 'GET',
      // contentType: 'application/json; charset=utf-8',
      data: {
        responseType: 'modal',
        contentOnly: true,
        teaserList: true,
        redirectTo: window.location.pathname
      },
      // processData: false
    })
    .then(function (r) {
      // dont have more
      if (!r) return commentsList.attr('data-have-more', 'false');

      if (page == '1') {
        commentsList.html(r);
        we.comment.setLoadMore(commentsList);
      } else {
        commentsList.append(r);
      }

      commentsList.attr('data-comments-page', Number(page)+1);

      commentsList.parent()
      .find('.comments-sumary .size')
      .text(commentsList.children('.comment-teaser').length);
    }).always(function () {

      commentsList.attr('data-loading-more', 'false');

    }).fail(function (err) {
      console.error('Error on get comments:', err);
    });
  },

  setLoadMore: function(commentsList) {
    commentsList.on('scroll', function() {
      if (
        $(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight &&
        commentsList.attr('data-loading-more') != 'true' &&
        commentsList.attr('data-have-more') != 'false'
      ) {
        commentsList.attr('data-loading-more', 'true');
        we.comment.loadMore(commentsList);
      }
    })
  },

  loadMore: function loadMore(commentsList) {
    we.comment.getComments(commentsList);
  },

  pubSub: {
    haveNewCommnets: false,
    timeToNextPing: 15000, // 15000
    lastCommentDate: new Date().toISOString(),
    register: function register(commentsAreaId) {
      // start the pooling for new comments:
      this.checkIfHaveNewComments(commentsAreaId);
    },

    checkIfHaveNewComments: function checkIfHaveNewComments(commentsAreaId) {
      var self = this;

      if (self.haveNewCommnets) {
        setTimeout(function () {
          self.checkIfHaveNewComments(commentsAreaId)
        }, (self.timeToNextPing*2) );
        return null;
      }

      var area = $('#'+commentsAreaId);
      var modelName = area.attr('data-modelname');
      var modelId = area.attr('data-modelid');

      // if (we.io && we.socket) {
      //   we.socket.emit('comment:subscribe', {
      //     modelName: modelName,
      //     modelId: modelId
      //   });
      // }

      var url = '/comment/count';

      $.ajax({
        url: url,
        method: 'GET',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        processData: true,
        data: {
          modelName: modelName,
          modelId: modelId,
          // since: self.lastCommentDate,
          // redirectTo: location.pathname,
          // contentOnly: true
        }
      })
      .then(function (r) {
        if ( !r || !r.count ) {
          area.find('.comments-sumary-have-new').hide();
          area.find('.cshn-count').text(0);
          // no comments found.
          return;
        }

        var $sumary = area.find('.comments-sumary');
        var $total = $sumary.find('.total');

        if (Number($total.text()) >= Number(r.count)) {
          // loadded all comments
          return;
        }

        self.haveNewCommnets = true;

        $total.text( String(r.count) );

        area.find('.comments-sumary-have-new').show();
        area.find('.cshn-count').text(r.count);
        return null;
      })
      .fail(function (err) {
        console.error('Error on create comment:', err);
        return null;
      })
      .always(function() {
        setTimeout(function() {
          self.checkIfHaveNewComments(commentsAreaId)
        }, self.timeToNextPing);
        return null;
      });
    }
  }
};

function increaceCount($sumary) {
  var $total = $sumary.find('.total');
  var $size = $sumary.find('.size');

  $total.text( Number($total.text())+1 );
  $size.text( Number($size.text())+1 );
}

})(window.we);