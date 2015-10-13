var module = angular.module('admin', []);

var kc_server = "http://jboss-keycloak:8080";
var app_server = "http://jboss-keycloak:8180";
var formapiId = "a48a299f-e498-490b-854c-5e63d645a2b7";
var userAdmin = "5bb76aca-1fac-4b12-85be-87bbc1cb5c78";
var tokenId = "";

var auth = {};
var logout = function(){
    console.log('*** LOGOUT');
    auth.loggedIn = false;
    auth.authz = null;
    window.location = auth.logoutUrl;
};

angular.element(document).ready(function ($http) {
    console.log("*** here");
    var keycloakAuth = new Keycloak('keycloak.json');
    auth.loggedIn = false;

    keycloakAuth.init({ onLoad: 'login-required' }).success(function () {
        console.log('efetuando login');
        auth.loggedIn = true;
        auth.authz = keycloakAuth;
        auth.logoutUrl = keycloakAuth.authServerUrl + "/realms/" + keycloakAuth.realm + "/tokens/logout?redirect_uri=" + app_server + "/formapi/index.html";
        module.factory('Auth', function() {
            return auth;
        });
        angular.bootstrap(document, ["admin"]);
        tokenId = auth.authz.token;
    }).error(function () {
        alert("failed to login");
    });
});

function tokenCtrl($scope) {
    $scope.token = tokenId;
}

module.controller('tokenCtrl', tokenCtrl);

module.controller('GlobalCtrl', function($scope, $http) {
    $scope.roles = [];
    $scope.rolesClient = [];
    $scope.serverInfo = [];
    $scope.realm = [];
    $scope.version = [];
    $scope.profile = [];
    $scope.userRoles = [];
    $scope.loadUserRoles = function() {
        $http.defaults.headers.common.Authorization = 'Bearer ' + auth.authz.token;
        $http.get(kc_server + "/auth/admin/realms/" + auth.authz.realm + "/users/" + userAdmin + "/role-mappings").success(function(data) {
            $scope.userRoles = angular.fromJson(data);
        });
    };
    $scope.loadRoles = function() {
    $http.defaults.headers.common.Authorization = 'Bearer ' + auth.authz.token;
        $http.get(kc_server + "/auth/admin/realms/" + auth.authz.realm + "/roles").success(function(data) {
            $scope.roles = angular.fromJson(data);
        });
    };
    $scope.addRole = function() {
        var roleName = document.getElementById('roleAdd').value;
        $http.post(kc_server + "/auth/admin/realms/" + auth.authz.realm + "/roles", {name: roleName}).success(function() {
            $scope.loadRoles();
        });
    };
    $scope.deleteRole = function() {
    var roleName = document.getElementById('roleDelete').value;
        $http.delete(kc_server + "/auth/admin/realms/" + auth.authz.realm + "/roles/" + roleName).success(function() {
            $scope.loadRoles();
        });
    };

    $scope.loadRolesClient = function() {
        $http.defaults.headers.common.Authorization = 'Bearer ' + auth.authz.token;
            $http.get(kc_server + "/auth/admin/realms/" + auth.authz.realm + "/clients/" + formapiId + "/roles").success(function(data) {
                $scope.rolesClient = angular.fromJson(data);
            }
        );
    };
    $scope.addRoleClient = function() {
        var roleName = document.getElementById('roleAddClient').value;
        $http.post(kc_server + "/auth/admin/realms/" + auth.authz.realm + "/clients/" + formapiId + "/roles", {name: roleName}).success(function() {
            $scope.loadRolesClient();
        });
    };
    $scope.deleteRoleClient = function() {
    var roleName = document.getElementById('roleDeleteClient').value;
        $http.delete(kc_server + "/auth/admin/realms/" + auth.authz.realm + "/clients/" + formapiId + "/roles/" + roleName).success(function() {
            $scope.loadRolesClient();
        });
    };

    $scope.loadServerInfo = function() {
        $http.get(kc_server + "/auth/admin/serverinfo").success(function(data) {
            $scope.serverInfo = angular.fromJson(data);
        });
    };

    $scope.loadPublicRealmInfo = function() {
        $http.get(kc_server + "/auth/realms/master").success(function(data) {
            $scope.realm = angular.fromJson(data);
        });
    };

    $scope.loadVersion = function() {
        $http.get(kc_server + "/auth/version").success(function(data) {
            $scope.version = angular.fromJson(data);
        });
    };

    $scope.loadProfile = function() {
        console.log('bearer: ' + auth.authz.token);
        //$http.defaults.headers.common.Authorization = 'Bearer ' + auth.authz.token;
        //$http.get(kc_server + "/auth/realms/master/account").success(function(data) {
            //$scope.profile = angular.fromJson(data);
        //});
        //alert('profile: ' + auth.authz.profile);
        //alert('promise: ' + auth.authz.promise);
        //alert('loadProfile: ' + auth.authz.loadUserProfile());
    }

    $scope.logout = logout;
});


module.factory('authInterceptor', function($q, Auth) {
    return {
        request: function (config) {
            var deferred = $q.defer();
            if (Auth.authz.token) {
                Auth.authz.updateToken(5).success(function() {
                    config.headers = config.headers || {};
                    config.headers.Authorization = 'Bearer ' + Auth.authz.token;

                    deferred.resolve(config);
                }).error(function() {
                        deferred.reject('Failed to refresh token');
                    });
            }
            return deferred.promise;
        }
    };
});


//module.config(function($httpProvider) {
//    $httpProvider.responseInterceptors.push('errorInterceptor');
//    $httpProvider.interceptors.push('authInterceptor');
//});

module.factory('myHttpInterceptor', function($q, dependency1, dependency2) {
  return {
    // optional method
    'request': function(config) {
      // do something on success
      return config;
    },

    // optional method
   'requestError': function(rejection) {
      // do something on error
      if (canRecover(rejection)) {
        return responseOrNewPromise
      }
      return $q.reject(rejection);
    },



    // optional method
    'response': function(response) {
      // do something on success
      return response;
    },

    // optional method
   'responseError': function(rejection) {
      // do something on error
      if (canRecover(rejection)) {
        return responseOrNewPromise
      }
      return $q.reject(rejection);
    }
  };
});

module.factory('errorInterceptor', function($q) {
    return function(promise) {
        return promise.then(function(response) {
            return response;
        }, function(response) {
            if (response.status == 401) {
                console.log('session timeout?');
                logout();
            } else if (response.status == 403) {
                alert("Forbidden");
            } else if (response.status == 404) {
                alert("Not found");
            } else if (response.status) {
                if (response.data && response.data.errorMessage) {
                    alert(response.data.errorMessage);
                } else {
                    alert("An unexpected server error has occurred");
                }
            }
            return $q.reject(response);
        });
    };
});
