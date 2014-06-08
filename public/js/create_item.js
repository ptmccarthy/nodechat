$(document).ready(function() {
  $('.item_type').click(function() {
    var id = $(this).attr('id');
    if (id == 'template') {
      $('#user_list').hide();
      $('#template_list').hide();
      $('#item_form').show();
    } else if (id == 'unique') {
      $('#user_list').show();
      $('#template_list').hide();
      $('#item_form').show();
    } else {
      $('#template_list').show();
      $('#user_list').show();
      $('#item_form').hide();
    }
  });
  $('#template').click();
});
