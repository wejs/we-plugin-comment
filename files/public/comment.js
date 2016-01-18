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

    var commentArea = $('#comment-'+formData.modelName+ '-' + formData.modelId);

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
      // then append the new comment
      commentArea.children('.comments').prepend(r);
    }).fail(function (err) {
      console.error('Error on create comment:', err);
    });

    return false;
  },

  showAll: function(modelName, modelId) {

  }
};

})(window.we);