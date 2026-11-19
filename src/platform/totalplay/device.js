/* TP.device — identificación de dispositivo (guía §9, §10, §24).
   Único punto que lee sagem.Get para info de equipo. Fuera del STB devuelve un mock. */
(function (w) {
  var TP = w.TP = w.TP || {};

  function hasRuntime() {
    return typeof w.sagem !== 'undefined' && w.sagem && typeof w.sagem.Get === 'function';
  }

  function get() {
    if (!hasRuntime()) return null;
    try { return w.sagem.Get.apply(w.sagem, arguments); } catch (e) { return null; }
  }

  var MOCK = {
    model: 'DEV-BROWSER',
    productId: 'mock',
    softwareVersion: '0.0.0-dev',
    serialNumber: 'DEV-0000',
    mac: '00:00:00:00:00:00'
  };

  TP.device = {
    hasRuntime: hasRuntime,
    get: get,
    getModel: function () { return hasRuntime() ? get('WEBSERVICE', 'USER_AGENT') : MOCK.model; },
    getProductId: function () { return hasRuntime() ? get('INFO', 'PRODUCT_ID') : MOCK.productId; },
    getSoftwareVersion: function () { return hasRuntime() ? get('INFO', 'SOFTWARE_VERSION') : MOCK.softwareVersion; },
    getSerialNumber: function () { return hasRuntime() ? get('INFO', 'SERIAL_NUMBER') : MOCK.serialNumber; },
    getMacAddress: function () { return hasRuntime() ? get('NETWORK', 'MAC') : MOCK.mac; },
    /* Solo diagnóstico (§10). No sustituye la spec de DRM. */
    getHdmiResolution: function () { return hasRuntime() ? get('STB', 'HDMI', 'RESOLUTION') : (w.innerWidth + 'x' + w.innerHeight); }
  };
})(window);
