/**
 * json解析失败需要抛出RES.ResourceManagerError,否则在ResourceLoader.prototype.loadSingleResource
 * if (!error.__resource_manager_error__) {
 * 		throw error;
 * }
 * 会被直接抛出不被资源管理器正确捕获并处理
 */

RES.processor.JsonProcessor.onLoadStart = function (host, resource) {
	return host.load(resource, 'text').then(function (text) {
		var data;
		try {
			data = JSON.parse(text);
		} catch (e) {
			throw new RES.ResourceManagerError(2003, resource.name, e.message);
		}
		return data;
	});
}