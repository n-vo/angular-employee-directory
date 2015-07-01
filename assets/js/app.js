window.routes =
{
    "/": {
        templateUrl: 'assets/tpl/lists.html', 
        controller: ListCtrl, 
        requireLogin: false
		},
    "/add-user": {
        templateUrl: 'assets/tpl/add-new.html', 
        controller: AddCtrl, 
        requireLogin: true
	},
    "/details/:id": {
        templateUrl: 'assets/tpl/edit.html', 
        controller: EditCtrl, 
        requireLogin: false
	},
    "/edit/:id": {
        templateUrl: 'assets/tpl/edit.html', 
        controller: EditCtrl, 
        requireLogin: true
	},
    "/hr": {
        templateUrl: 'assets/tpl/hr.html', 
        controller: HrCtrl, 
        requireLogin: false
    },
    "/logout": {
		templateUrl:'assets/tpl/logout.html', 
        controller: LogoutCtrl, 
        requireLogin: false
    }
};

angular.module('EmployeeDirectoryApp', ['ngRoute', 'angularUtils.directives.dirPagination'])
.config(['$routeProvider', function($routeProvider){
	for(var path in window.routes) {
		$routeProvider.when(path, window.routes[path]);
	}
	$routeProvider.otherwise({redirectTo: '/'});
}])
.service('SessionService', function() {
	var userIsAuthenticated = false;

    this.setUserAuthenticated = function(value){
        userIsAuthenticated = value;
    };

    this.getUserAuthenticated = function(){
	    return userIsAuthenticated;
    };
	
})
.service('dataService', ['$http', function($http, SessionService) {
	var baseUrl = 'http://ngjs-spa.nathanvo.com/';
	
	this.getUsers = function () {
		return $http.get(baseUrl + 'api/users');
    };
	
	this.deleteUser = function(id) {
		return $http.delete(baseUrl + 'api/users/'+id);
	};
	
	this.addUser = function(user) {
		return $http.post(baseUrl + 'api/add_user', user);
	};
	
	this.getUser = function (id) {
		return $http.get(baseUrl + 'api/users/'+id);
    };
	
	this.updateUser = function(id, user) {
		return $http.put(baseUrl + 'api/users/'+id, user)
	};
	
	this.deleteUser = function(id) {
		return $http.delete(baseUrl + 'api/users/'+id);	
	};
	
	this.validate = function(item, value) {
		return $http.get(baseUrl + 'api/validate/'+item+'/'+value)
	}
	
	this.hrLogin = function(user) {
		//Testing local
		//return $http.get(baseUrl + 'api/hr/'+user.username+'/'+user.password);
		
		return $http.post(baseUrl + 'api/hr', user);
		
	};
	
}])
.directive('focusMe', function($timeout, $parse) {
  return {
	restrict: 'A',  
    link: function(scope, element, attrs) {
      var model = $parse(attrs.focusMe);
      scope.$watch(model, function(value) {
        if(value === true) { 
          $timeout(function() {
            element[0].focus(); 
          },0);
        }
      });
      
    }
  };
})
.directive('inputMaskPhone', function () {
	return {
		require: "ngModel",
		link: function (scope, elem, attr, ctrl) {
			elem.inputmask("999-999-9999");
			elem.on('keyup', function () {
				scope.$apply(function(){
					ctrl.$setViewValue(elem.val());
				});
			});
		}
	};
})
.directive('inputMaskEmail', function () {
	return {
		require: "ngModel",
		link: function (scope, elem, attr, ctrl) {
			elem.inputmask("email");
			elem.on('keyup', function () {
				scope.$apply(function(){
					ctrl.$setViewValue(elem.val());
				});
			});
		}
	};
})
.directive('checkAvailable', function($http, $timeout, dataService) {
    return {
        require: 'ngModel',
        link: function(scope, elem, attr, ctrl) {
			var item = attr.name;
			var oriVal = angular.isDefined(scope.user) ? scope.user[item] : null;
			
			ctrl.$parsers.push(function(viewValue) {
				//console.log(viewValue,oriVal);
				//console.log(ctrl.$valid);
					  
				if ( !angular.equals(viewValue,oriVal) ) {	//compare new value vs original value
					//console.log('not equal to original');
					// set it to true here, otherwise it will not 
                	// clear out when previous validators fail.
                	ctrl.$setValidity(item + 'Available', true);
					
					if(ctrl.$valid) {
						//console.log('ctrl is valid');
					  // set it to false here, because if we need to check 
					  // the validity of the email, it's invalid until the 
					  // AJAX responds.
					  if(viewValue !== "" && typeof viewValue !== "undefined") {
						  dataService.validate(item, viewValue)
							.success(function (data) {
								if (data > 0) {
									ctrl.$setValidity(item +'Available', false);
								} else {
									ctrl.$setValidity(item + 'Available', true);
								}
							})
							.error(function(data) {
							  ctrl.$setValidity(item + 'Available', false);
							}); 
						
					  }//end if viewValue
					}//end if ctrl.valid
                }
                return viewValue;
            });
            
        }
    };
})
.run (function($rootScope, $location, SessionService) {
	$rootScope.isLoggedIn = false;
	$rootScope.$on("$routeChangeStart", function(event, next, current) {
		
		$rootScope.isLoggedIn = SessionService.getUserAuthenticated();
		
		if (angular.element(".navbar-toggle").attr("aria-expanded") == "true") {
			angular.element(".navbar-toggle").trigger('click');
		}
	
		if(next.requireLogin && !SessionService.getUserAuthenticated()) {
			alert("You need to be authenticated to see this page!");
			event.preventDefault();
		}
    });
	
});

function LogoutCtrl($rootScope, $scope, $location, SessionService) {
	SessionService.setUserAuthenticated(false);
	$scope.activePath = $location.path('/#/');
	
}

function HrCtrl($rootScope, $scope, $location, dataService, SessionService) {
	$scope.errAllow = 3;
	$scope.loginFail = false;
	
	if (SessionService.getUserAuthenticated()) {
		$scope.activePath = $location.path('#/');
	}
	
	$scope.login = function(user) {
		
		dataService.hrLogin(user)
		.success(function (data) {
			if (data > 0) {
				SessionService.setUserAuthenticated(true);
				$scope.activePath = $location.path('#/');
			} else {
				$scope.loginFail = true;
				$scope.errAllow--;
				if ($scope.errAllow == 0) $scope.activePath = $location.path('#/');
			}
		}).error(function(){
			$scope.activePath = $location.path('#/');
		});
		
	};
	
  
}

function ListCtrl($rootScope, $scope, $location, dataService, SessionService) {
	$scope.order = 'first';
	$scope.reverse = false;
	$scope.currentPage = 1;
    $scope.pageSize = 5;
	
	dataService.getUsers()
		.success(function (data) {
			$scope.users = data;
		});
		
	$scope.edit = function(user) {
		if (SessionService.getUserAuthenticated()) {
			$location.path('edit/'+user.id);
		} else {
			$location.path('details/'+user.id);
		}
	};
	
	$scope.sort = function(id) {
		$scope.reverse = $scope.reverse === false ? true: false;
		$scope.order = id;
	}
	
	$scope.delete = function(user) {
		var deleteUser = confirm('Are you absolutely sure you want to delete?');
		if (deleteUser) {
			dataService.deleteUser(user.id)
				.success(function () {
					$scope.activePath = $location.path('#/');
				});
		}
	};
  
}

function AddCtrl($scope, $http, $location, dataService) {
	$scope.master= {};
	$scope.activePath = null;
	
	$scope.reset = function() {
		$scope.user = null;
	};
	
	$scope.add_new = function(user, AddNewForm) {
		dataService.addUser(user)
			.success(function () {
				$scope.reset();
				$scope.activePath = $location.path('#/');
			});
		$scope.reset();
	};
	
}

function EditCtrl($scope, $http, $location, $routeParams, dataService) {
	$scope.master= {};
	var id = $routeParams.id;
	$scope.activePath = null;
	
	dataService.getUser(id)
		.success(function (data) {
			$scope.users = data;
			$scope.master= angular.copy($scope.users[0]);
		});

  $scope.update = function(user){
	  dataService.updateUser(id, user)
		.success(function (data) {
			$scope.activePath = $location.path('#/');
		});
  };
  
  $scope.isUnchanged = function(user) {
	return angular.equals(user, $scope.master);
  };
  
  $scope.delete = function(user) {
    var deleteUser = confirm('Are you absolutely sure you want to delete?');
    if (deleteUser) {
		dataService.deleteUser(user.id)
			.success(function (data) {
				$scope.activePath = $location.path('#/');
			}); 
    }
  };
}
