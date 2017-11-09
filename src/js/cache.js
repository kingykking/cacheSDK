window.Xhrfactory = function() {
	this.init();
}
window.Xhrfactory.prototype = {
	init: function() {
		this.xhr = this.create();
	},
	create: function() {
		var xhr = null;
		if(window.XMLHttpRequest) {
			xhr = new XMLHttpRequest();
		}
		else if (window.ActiveXObject) {
			xhr  = new ActiveXObject('Msml2.Xmlhttp'); //IE7及以后版本IE
		}
		else {
			xhr = new ActiveXobject('Microsoft.Xmlhttp');//其他版本IE
		}
		return xhr;
	},
	readystate: function(callback) {
		this.xhr.onreadystatechange = function(){
			if(this.readyState === 4 && this.status === 200) { //this发生了默认绑定，指向了xhr
				callback(this.responseText);
				console.log(this);
			}
		}
	},
	para: function(data) {
		var datastr = '';
		if(data && Object.prototype.toString.call(data) === "[object object]") { //判断对象是否为对象
			for(var i in data) {
				for (var i=0;i<length;i++){
					datastr += i + '='
					data[i] + '&';
				}
			}
			datastr = '?' + datastr;
		}
		return datastr;	
	},
	get: function(url,data,callback) {
		this.readystate(callback);
		var newurl = url;
		var datastr = this.para(data);
		newurl = url + datastr;
		this.xhr.open('get',newurl,false);//这里不能使用true 需要使用false来解决异步问题
		this.xhr.send();
	}
};

var localStorageSign = 'off'; //后台开关控制，防止缓存失效
var resourceVersion = '20171112'; //版本控制

//本地SDK方法
window.mLocalSdk = {//注意相互依赖，需要按顺序加载
	resourceJavascriptList: [
	{
		id:'0',
		url:'./src/js/jquery.js',
		type:'javascript'
	},
	{
		id:'1',
		url:'./src/js/bootstrap.js',
		type:'javascript'
	},
	{
		id:'2',
		url:'./src/js/test.js',
		type:'javascript'
	}
	],

	resourceCssList : [],
	noNeedUpdate: (function() {
		return localStorage.getItem('resourceVersion') === resourceVersion;
	})(),

	isIE: (function(){
		if (!!window.ActiveXObject || "ActiveXObject" in window) //通过能力判断IE
			return true;
		else
			return false;
	})(),
	//判断是否超过localstorage的阀值
	checkHedge: function(){
		var localStorageLength = localStorage.length;
		var localStorageSize = 0;
		for (var i = 0; i < localStorageLength; i++) {
			var key = localStorage.key(i);
			localStorageByte += localStorage.getItem(key).length;
		}
		return localStorageSize;
	},

	saveSDK: function() {
		try {
			localStorage.setItem("resourceVersion",resourceVersion);
		} catch (Excepition) {
			if (Exception.name == "QuotaExceededError") {
				localStorage.clear();
				localStorage.setItem("resourceVersion",resourceVersion);
			}
			alert('QuotaExceededError');
		}

		for(var i = 0; i< this.resourceJavascriptList.length; i++) {
			var _self = this;//保存this指针
			(function(i){
				var scriptId = _self.resourceJavascriptList[i].id;
				var xhr = new Xhrfactory();
				xhr.get(_self.resourceJavascriptList[i].url,null,function(data){
					try {
						localStorage.setItem(scriptId,data);
					} catch (Exception) {
						console.log('Excpetion',Excpetion);
						if (Exception.name == "QuotaExceededError") {
							localStorage.clear();
							localStorage.setItem("resourceVersion",resourceVersion);
						}
					}
				})
			})(i);
		}
		for(var i = 0; i< this.resourceCssList.length; i++) {
			var _self = this;//保存this指针
			(function(i){
				var cssId = _self.resourceCssList[i].id;
				var xhr = new Xhrfactory();
				xhr.get(_self.resourceCssList[i].url,null,function(data){
					try {
						localStorage.setItem(cssId,data);
					} catch (Exception) {
						console.log('Excpetion',Excpetion);
						if (Exception.name == "QuotaExceededError") {
							localStorage.clear();
							localStorage.setItem("resourceVersion",resourceVersion);
						}
					}
				})
			})(i);
		}
	},
	startup: function(){
		var _self = this;
		if (localStorageSign === 'on' && !this.isIE && window.localStorage) {
			if (this.noNeedUpdate === true) {//使用本地 则在本地进行内联引入
				return (function() {
					for (var i = 0; i < _self.resourceJavascriptList.length; i++) {
						var scriptId = _self.resourceJavascriptList[i].id;
						window.mDomUtils.addJavascriptByInline(scriptId);	
				}
					for (var i = 0; i < _self.resourceCssList.length; i++) {
						var cssId = _self.resourceCssList[i].id;
						var cssString = localStorage.getItem(cssId);
						window.mDomUtils.addCssByInline(cssString);
				}	
				})();			
			}
			else {
				return (function() {
					_self.saveSDK(); //这里会存在异步回调问题 需要确保保存后再进行后面的操作 通过open.false解决
					for (var i = 0; i < _self.resourceJavascriptList.length; i++) {
						var scriptId = _self.resourceJavascriptList[i].id;
							window.mDomUtils.addJavascriptByInline(scriptId);	
					}
					for (var i = 0; i < _self.resourceCssList.length; i++) {
						var cssId = _self.resourceCssList[i].id;
						var cssString = localStorage.getItem(cssId);
						window.mDomUtils.addCssByInline(cssString);
					}
				})();
			}
		}
		else {
			return (function() {//不使用本地，则在外链中引入进行下载，这里存在两个异步问题：1.JS没下载完就继续执行其他程序 2.jq和bs无法保证先后依赖顺序下载
				for (var i = 0; i < _self.resourceCssList.length; i++) {
						window.mDomUtils.addCssByLink(_self.resourceCssList[i]['url']);					
				}
				window.mDomUtils.addJavascriptByLink(_self.resourceJavascriptList,0);	
			})()
		}
	}
}

window.mDomUtils = {
	//内联方式 直接写代码
	addJavascriptByInline: function(scriptId) {
		var script = document.createElement('script');
		script.setAttribute('type','text/javascript');
		script.id = scriptId;
		var heads = document.getElementsByTagName('head');
		if(heads.length) {
			heads[0].appendChild(script);
		}
		else {
			document.documentElement.appendChild(script);
		}
		script.innerHTML = localStorage.getItem(scriptId);
	},
	//外链方式 直接引用 需要同步加载js
	addJavascriptByLink: function(list,count) {
/*		var script = document.createElement('script');
		script.setAttribute('type','text/javascript');
		script.setAttribute('src',url);
		script.id = scriptId;
		var heads = document.getElementsByTagName('head');
		if (heads.length) {
			heads[0].appendChild(script);
		} else{
			document.documentElement.appendChild(script);
		}*///这种方式会引起js异步加载，无法达到同步效果 不可取
/*		var xhr = new Xhrfactory();
		xhr.get(url,null,function(data){
			var script = document.createElement('script');
			script.setAttribute('type','text/javascript');
			script.setAttribute('src',url);
			script.id = scriptId;
			var heads = document.getElementsByTagName('head');
			if (heads.length) {
				heads[0].appendChild(script);
			} else{
				document.documentElement.appendChild(script);
			}
		});//这种方式会引起js加载两次 不可取*/
		var head= document.getElementsByTagName('head'); 
		var script= document.createElement('script'); 
		script.type= 'text/javascript'; 
		script.src = list[count].url; 
		if (head.length) {
			head[0].appendChild(script);
		} else{
			document.documentElement.appendChild(script);
		}//最终选择这种方式进行递归调用 借用jquery思想
		script.onload = script.onreadystatechange = function() { 
		if (!this.readyState || this.readyState === "loaded" || this.readyState === "complete" ) { 
			count++;
			if (count < list.length){
				window.mDomUtils.addJavascriptByLink(list,count);
			}
			else {
				return true;
			}
			// Handle memory leak in IE 
			script.onload = script.onreadystatechange = null; 
			}
		 };  
	},

	addCssByInline: function(cssString) {
		var link = document.createElement('link');
		link.setAttribute('type','text/css');
		link.setAttribute('rel','stylesheet');
		if(link.stylesheet){
			link.stylesheet.cssText = cssString;
		}
		else {
			var cssText = document.createTextNode(cssString);
			link.appendChild(cssText);
		}
		var heads = document.getElementsByTagName('head');
		if(heads.length) {
			heads[0].appendChild(link);
		}
		else {
			document.documentElement.appendChild(link);
		}
	},

	addCssByLink: function(url) {
		var link = document.createElement('link');
		link.setAttribute('href',url);
		link.setAttribute('type','text/css');
		link.setAttribute('rel','stylesheet');
		var heads = document.getElementsByTagName('head');
		if(heads.length) {
			heads[0].appendChild(link);
		}
		else {
			document.documentElement.appendChild(link);
		}
	}
}