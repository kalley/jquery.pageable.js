(function($, Modernizr) {

  // Pageable constructor
  var Pageable = function(el, options) {
        var $currentPage,
            index;

        this.options = options;

        this.el = el.jquery ? el[0] : el;
        this.$el = el.jquery ? el : $(el);
        this.$pages = this.$el.find(options.pageSelector);

        // Stop because there aren't multiple pages
        if ( this.$pages.length < 2 ) return;

        this.$pages.addClass(options.pageClass);

        this.$indicators = $();

        this.eventend = options.transitionType + 'end webkit' + ( options.transitionType.charAt(0).toUpperCase() + options.transitionType.substr(1).toLowerCase() ) + 'End';

        $currentPage = this.$el.find(options.pageSelector + '.' + options.activeClass);

        this.$currentPage = ( $currentPage.length ? $currentPage : this.$pages.filter(':lt(' + this.options.pages + ')') )
          .addClass(options.activeClass);

        if ( this.$currentPage.length < options.pages ) {
          index = this.$pages.index($currentPage) - ( this.$pages.index($currentPage) % options.pages );
          this.$currentPage = this.$pages.filter(function(i) {
            return i >= index && i < index + options.pages;
          }).addClass(options.activeClass);
        }

        if ( this.$currentPage.length > options.pages ) {
          this.$pages.removeClass(options.activeClass);
          this.$currentPage = this.$currentPage.first().addClass(options.activeClass);
        }
        this.$el.addClass('pageable');

        delegateEvents.call(this);
        addButtons.call(this);
        if ( options.showNav ) {
          addNav.call(this);
        }
        this.init();

      },
      // private methods
      addNav = function() {
        var _this = this;
        this.$indicators = this.$el.append('<nav class="' + this.options.navClass + '">' + $.map(this.$pages, function(el, i) {
          var title = $(el).data('title');
          return '<button><span' + ( title ? '' : ' class="' + _this.options.screenreaderClass + '"' ) + '>' + ( title || i + 1 ) + '</span></button>';
        }).join('') + '</nav>')
          .find('.' + this.options.navClass + ' button')
          .on('click', function() {
            _this.changePage(_this.$indicators.index(this));
          });
      },
      addButtons = function() {
        var prefix = this.options.iconPrefix,
            buttonClass = this.options.buttonClass;
        this.$el.append($.map(this.options.directions, function(dir) {
          return '<button class="' + prefix + dir + ' ' + buttonClass + '"></button>';
        }));
      },
      delegateEvents = function() {
        var _this = this,
            prefix = this.options.iconPrefix;
        this.$el.on('click.pageable', '[class^="' + prefix + '"]', function(ev) {
          var dir,
              forwards;
          if ( ! _moving ) {
            _moving = true;
            dir = this.className.match(new RegExp('\\b' + prefix + '(.*?)(?:\\s|$)'))[1].toLowerCase();
            forwards = ( dir === 'right' || dir === 'down' );
            _this.changePage(_this.$pages.index(_this.$currentPage) + ( forwards ? 1 : -1 ) * _this.options.pages);
          }
          ev.stopPropagation();
          ev.preventDefault();
        });
      },
      // prototype reference
      proto = Pageable.prototype,
      _moving = false,
      defaults;

  proto.init = function() {
    var index = this.$pages.index(this.$currentPage);
    if ( ! this.options.loop ) {
      this.$el.toggleClass(this.options.moreClass, index + this.options.pages < this.$pages.length)
        .toggleClass(this.options.fewerClass, index > 0);
    } else {
      this.$el.addClass(this.options.fewerClass + ' ' + this.options.moreClass);
    }
    this.$indicators.eq(index)
      .addClass(this.options.activeClass)
      .siblings()
        .removeClass(this.options.activeClass);
  };
  proto.changePage = function(index) {
    var _this = this,
        howMany = this.options.pages,
        forwards = index > this.$pages.index(this.$currentPage),
        to = this.$pages.filter(function(i) {
          return i >= index && i < index + howMany;
        }),
        from = this.$currentPage,
        activeClass = this.options.activeClass,
        beforeClass = this.options.beforeClass,
        changingClass = this.options.changingClass,
        indexChanged = false,
        addBeforeToFrom = forwards;

    if ( ! to.length ) {
      if ( this.options.loop ) {
        indexChanged = true;
        index = index <= 0 ? this.$pages.length - this.options.pages : 0;
        to = this.$pages.filter(function(i) {
          return i >= index && i < index + howMany;
        });
      } else {
        _moving = false;
        return;
      }
    }

    this.$pages.filter(':gt(' + ( index + this.options.pages - 1 ) + ')')
      .removeClass(beforeClass)
        .filter(':not(.' + activeClass + ')')
        .css(this.options.transitionType, 'none');
    this.$pages.filter(':lt(' + index + ')')
      .addClass(beforeClass)
        .filter(':not(.' + activeClass + ')')
        .css(this.options.transitionType, 'none');

    if ( indexChanged ) {
      addBeforeToFrom = index === 0;
      to.css(this.options.transitionType, 'none')
        .toggleClass(beforeClass, index !== 0);
    }

    this.$currentPage = to;
    if ( Modernizr && Modernizr['css' + this.options.transitionType + 's'] ) {
      setTimeout(function() {
        from.addClass(changingClass)
          .toggleClass(beforeClass, addBeforeToFrom)
          .one(_this.eventend, function() {
            from.removeClass(changingClass)
              .css(_this.options.transitionType, 'none')
              .toggleClass(beforeClass, forwards || ( ! addBeforeToFrom && indexChanged ));
              setTimeout(function() {
                from.css(_this.options.transitionType, '');
              }, 20);
          });
        to.css(_this.options.transitionType, '')
          .addClass(changingClass)
          .one(_this.eventend, function() {
            _moving = false;
            setTimeout(function() {
              to.removeClass(changingClass + ' ' + beforeClass)
                .nextAll()
                .removeClass(beforeClass);
              setTimeout(function() {
                _this.$pages.css(_this.options.transitionType, '');
              }, 20);
            }, 13);
          });
        setTimeout(function() {
          from.removeClass(activeClass);
          to.addClass(activeClass);
        }, 20);
      }, 20);
    } else {
      // Fallback to jquery.animate
      _moving = false;
      from.removeClass(activeClass);
      to.addClass(activeClass);
    }
    this.init();
  };

  proto.close = function() {
    this.$indicators.remove();
    this.$el.removeClass('pageable')
      .off('click.pageable');
    this.$el.find('>.' + this.options.buttonClass)
      .remove();
  };

  $.fn.pageable = function(options/* args, for, method, etc. */) {
    var isMethod = typeof options === 'string',
        args = isMethod ? Array.prototype.slice.call(arguments, 1) : null,
        opts = isMethod ? options : $.extend({}, defaults, options);

    return this.each(function() {
      var pageable = $.data(this, 'pageable');
      if ( pageable ) {
        if ( isMethod ) {
          if ( $.isFunction(pageable[opts]) ) {
            return opts !== 'init' ? pageable[opts].apply(pageable, args) : null;
          } else {
            return console.warn('The Pageable object has no method ' + opts);
          }
        } else {
          pageable.close();
        }
      }
      $.data(this, 'pageable', new Pageable(this, opts));
    });
  };

  defaults = $.fn.pageable.defaults = {
    pageClass: 'pageable-page',
    activeClass: 'is-active',
    beforeClass: 'is-before',
    changingClass: 'is-changing',
    iconPrefix: 'icon-angle-',
    navClass: 'pageable-nav',
    buttonClass: 'pageable-button',
    moreClass: 'has-more',
    fewerClass: 'has-fewer',
    screenreaderClass: 'visuallyhidden',
    pageSelector: '> *',
    transitionType: 'transition',
    directions: ['left', 'right', 'up', 'down'],
    showNav: true,
    loop: true,
    pages: 1
  };

})(jQuery, window.Modernizr);