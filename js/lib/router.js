/* this function extracts the arguments from the url based in the template
 * that was matched to it
**/
var getUrlParams = function(router, url) {
  var data = {
    router: {},
    controller: {}
  };
  var path = router.path;
  if(url.charAt(0) == '/') {
    url = url.substr(1);
  }
  if(path.charAt(0) == '/') {
    path = path.substr(1);
  }
  var tokensUrl = url.split('/');
  var tokensPath = path.split('/');
  var i = 2; //this is where the args start
  data.router.controller = tokensPath[0];
  //in cases like /users/:id, args start at 1 and action is 'index'
  if(tokensPath[1] === undefined || tokensPath[1].charAt(0) == ':') {
    i--;
    data.router.action = 'index';
  } else {
    data.router.action = tokensPath[1];
  }
  for(i; i < tokensUrl.length; i++) {
    var argName = tokensPath[i].substr(1);
    data.controller[argName] = tokensUrl[i];
  }
  return data;
};

var trimSlashes = function(str) {
  if(str.charAt(0) == '/') {
    str = str.substr(1);
  }
  if(str.charAt(str.length-1) == '/') {
    str = str.substr(0, str.length-1);
  }
  return str;
}

var Router = {
  routes: [],
  //TODO: use controller and action args to override default route interpretation
  register: function register(path, controller, action) {
    path = trimSlashes(path);
    Router.routes.push({
      path: path,
      regexp: Router.routeToRegExp(path),
      controller: controller,
      action: action
    });
  },
  callController: function(router, url) {
    var params = getUrlParams(router, url);
    if(controllers[params.router.controller]) {
      controllers[params.router.controller].invoke(params.router.action, params.controller);
    } else {
      throw new Error('Controller ' + params.router.controller + ' is not defined');
    }
  },
  // The function called when a route change event is detected
  listener: function(event) {
    var url = stripSlashes(location.hash.slice(1)) || '/'; //TODO: must be able to set a default controller and action for '/'
    //find the handler for this url
    _.any(Router.routes, function(route) {
     if(route.regexp.test(url)) {
       Router.callController(route, url);
       return true;
     }
    //TODO: call 404 controller
    console.log('404: route doesn\'t exist');
    });
  },
  // this function transform our route template into a regexp, so we can match it with the user inputed url
  routeToRegExp: function(route) {
    var optionalParam = /\((.*?)\)/g;
    var namedParam    = /(\(\?)?:\w+/g;
    var splatParam    = /\*\w+/g;
    var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

    route = route.replace(escapeRegExp, '\\$&')
                 .replace(optionalParam, '(?:$1)?')
                 .replace(namedParam, function(match, optional) {
                   return optional ? match : '([^/?]+)';
                 })
                 .replace(splatParam, '([^?]*?)');
    return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
  }
};

// Listen on hash change:
window.addEventListener('hashchange', Router.listener);  
// Listen on page load:
window.addEventListener('load', Router.listener);  
