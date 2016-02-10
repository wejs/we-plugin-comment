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
    url += '?redirectTo='+location.pathname;

    $.ajax({
      url: url
    }).then(function (result) {
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

    this.form.destroy();
    // scroll to comment
    $(document.body).scrollTop(this.commentButton.offset().top);

    return false;
  },
  onSubmitForm: function onSubmitForm (event) {
    event.preventDefault();

    var self = this;

    var form = this.form;
    var formData = {};
    form.serializeArray().forEach(function (d) {
      formData[d.name] = d.value;
    });

    var url = form.attr('action');

    $.ajax({
      url: url + '?responseType=modal',
      method: 'POST',
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify(formData),
      processData: false
    }).then(function (r) {
      // remove and close the form
      we.comment.close.bind(self)(event);

      // get comment id
      var html = $.parseHTML(r);
      var id = html[0].id;
      formData.id = id.replace('comment-', '');
      // render the comment
      we.comment.renderComment(formData, html);
    }).fail(function (err) {
      // TODO!
      console.error('Error on create comment:', err);
    });

    return false;
  },

  renderComment: function renderComment(record, html) {
    // check if this comment already are in html
    var comment = $('#comment-'+record.id);
    if (comment && comment.length) {
      console.log('>>1')
      comment.replaceWith(html);
    } else {
      console.log('>>2')
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

  getComments: function(commentsList) {
    var url = commentsList.attr('data-comments-url');
    var page = commentsList.attr('data-comments-page');

    $.ajax({
      url: url + '&page=' + page,
      method: 'GET',
      responseType: '',
      contentType: 'application/json; charset=utf-8',
      data: {
        responseType: 'modal',
        teaserList: true,
        redirectTo: window.location.pathname
      },
      // processData: false
    }).then(function (r) {
      // dont have more
      if (!r) return commentsList.attr('data-have-more', 'false');

      if (page == '1') {
        commentsList.html(r);
        we.comment.setLoadMore(commentsList);
      } else {
        commentsList.append(r);
      }

      commentsList.attr('data-comments-page', Number(page)+1);

      commentsList.parent().find('.comments-sumary .size')
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
    register: function register(commentsAreaId) {
      var area = $('#'+commentsAreaId);
      var modelName = area.attr('data-modelname');
      var modelId = area.attr('data-modelid');

      if (we.io && we.socket) {
        we.socket.emit('comment:subscribe', {
          modelName: modelName,
          modelId: modelId
        });
      }
    },

    setCommentEvents: function setCommentEvents() {
      we.socket.on('comment:created', function (data) {
        we.comment.renderComment(data.record, data.html);
      });
    }
  }
};

we.comment.pubSub.setCommentEvents();

})(window.we);