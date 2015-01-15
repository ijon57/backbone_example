$(function(){

  var User = Backbone.Model.extend({

    default: function(){
      return {
        name: "unnamed",
        enabled: true
      }
    },

    toggle: function(){
      this.save({enabled: !this.get("enabled")});
    }

  });

  var UserList = Backbone.Collection.extend({
    model: User,

    localStorage: new Backbone.LocalStorage("user-list"),

    enabled: function(){
      return this.where({enabled: true});
    },
    
    disabled: function(){
      return this.where({enabled: false});
    },

    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get("order") + 1;
    },

    comparator: "order"

  });

  var Users = new UserList;

  var UserView = Backbone.View.extend({

    tagName: "li",

    template: _.template($("#user-template").html()),

    events: {
      "click .toggle" : "toggleEnabled",
      "dblclick .view" : "edit",
      "click a.destroy" : "clear",
      "keypress .edit" : "updateOnEnter",
      "blur .edit" : "close"
    },

    initialize: function(){
      this.listenTo(this.model, "change", this.render);
      this.listenTo(this.model, "destroy", this.remove);
    },

    toggleEnabled: function(){
      this.model.toggle();
    },

    edit: function(){
      this.$el.addClass("editing");
      this.input.focus();
    },

    clear: function(){
      this.model.destroy();
    },

    updateOnEnter: function(e){
      if (e.keyCode == 13) this.close();
    },

    close: function(){
      var value = this.input.val();
      if (!value) {
        this.clear();
      } else {
        this.model.save({name: value});
        this.$el.removeClass("editing");
      }
    },

    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.toggleClass('disabled', !this.model.get('enabled'));
      this.input = this.$('.edit');
      return this;
    },

  });

  var AppView = Backbone.View.extend({

    el: $('#userapp'),

    statsTemplate: _.template($("#stats-template").html()),

    events: {
      "keypress #new-user":  "createOnEnter",
      "click #clear-disabled": "clearDisabled",
      "click #toggle-enabled": "toggleAllEnabled",
      "click #toggle-disabled": "toggleAllDisabled"
    },

    initialize: function() {
      this.input = $("#new-user");
      this.toggleEnabledCheckbox = $("#toggle-enabled")[0];
      this.toggleDisabledCheckbox = $("#toggle-disabled")[0];

      this.listenTo(Users, "add", this.addOne);
      this.listenTo(Users, "reset", this.addAll);
      this.listenTo(Users, "all", this.render);

      this.footer = $("#footer");
      this.main = $("#main");

      Users.fetch();
    },

    render: function() {
      var enabled = Users.enabled().length;
      var disabled = Users.disabled().length;

      console.log(enabled, disabled);

      if (Users.length) {
        this.main.show();
        this.footer.show();
        this.footer.html(this.statsTemplate({enabled: enabled, disabled: disabled}));
      } else {
        this.main.hide();
        this.footer.hide();
      }

      this.toggleEnabledCheckbox.checked = !disabled;
      this.toggleDisabledCheckbox.checked = !enabled;

      return this;
    },

    addOne: function(user) {
      var view = new UserView({model: user});
      $("#user-list").append(view.render().el);
    },

    addAll: function() {
      Users.each(this.addOne, this);
    },

    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      if (!this.input.val()) return;

      Users.create({name: this.input.val()});
      this.input.val("");
    },

    clearDisabled: function() {
      _.invoke(Users.disabled(), "destroy");
      return false;
    },

    toggleAllEnabled: function () {
      var enabled = this.toggleEnabledCheckbox.checked;
      Users.each(function (user) { user.save({"enabled": enabled}); });
    },

    toggleAllDisabled: function () {
      var enabled = !this.toggleDisabledCheckbox.checked;
      Users.each(function (user) { user.save({"enabled": enabled}); });
    }
  });

  var App = new AppView;
});