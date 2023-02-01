var ZSDKUtil = (function (c) {
    function f() {}
    function g(b) {
      var a = {};
      b = b || window.location.href;
      return (
        b
          .substr(b.indexOf("?") + 1)
          .split("\x26")
          .forEach(function (b) {
            b = b.split("\x3d");
            a[b[0]] = b[1];
          }),
        a.hasOwnProperty("serviceOrigin") &&
          (a.serviceOrigin = decodeURIComponent(a.serviceOrigin)),
        a
      );
    }
    var d,
      b = g();
    return (
      (f.prototype.Info = function () {
        (c.isDevMode() || c.isLogEnabled()) &&
          console.info.apply(console, arguments);
      }),
      (f.prototype.Error = console.error),
      (c.GetQueryParams = g),
      (c.isDevMode = function () {
        return b && b.isDevMode;
      }),
      (c.isLogEnabled = function () {
        return b && b.isLogEnabled;
      }),
      (c.getLogger = function () {
        return (d && d instanceof f) || (d = new f()), d;
      }),
      c
    );
  })(window.ZSDKUtil || {}),
  ZSDKMessageManager = (function (c) {
    function f(a) {
      try {
        var d = "string" == typeof a.data ? JSON.parse(a.data) : a.data;
      } catch (u) {
        d = a.data;
      }
      var c = d.type;
      try {
        var f;
        if (!(f = "__REGISTER__" === c)) {
          var k = a.source,
            r = a.origin;
          f =
            !(!h.isRegistered() || n !== k || v !== r) ||
            Error("Un-Authorized Message.");
        }
        if (f)
          switch (c) {
            case "__REGISTER__":
              a = d;
              n = window.parent;
              v = w.serviceOrigin;
              h.dcType = window.location.origin.split(".").pop().toUpperCase();
              "COM" === h.dcType && (h.dcType = "US");
              h.key = a.uniqueID;
              h.parentWindow = n;
              h._isRegistered = !0;
              e(
                { type: "__REGISTER__", widgetOrigin: p(), uniqueID: h.key },
                h
              );
              b(h, "Load", a.data);
              break;
            case "__EVENT_RESPONSE__":
              var m = d.promiseID,
                q = d.data,
                t = d.isSuccess;
              l.hasOwnProperty(m) &&
                (t ? l[m].resolve(q) : l[m].reject(q),
                (l[m] = void 0),
                delete l[m]);
              break;
            default:
              g(a, d);
          }
      } catch (u) {
        x.Error("[SDK.MessageHandler] \x3d\x3e ", u.stack);
      }
    }
    function g(a, e) {
      var c = e.widgetID;
      a = e.eventName;
      if (h.key === c) var f = b(h, a, e.data);
      else {
        var k = h._childWidgets[c];
        k && (f = b(k, a, e.data));
      }
      if (e.isPromise) {
        var g = {};
        Promise.all(f)
          .then(function (a) {
            g.response = a;
            g.widgetID = c;
            g.sourceWidgetID = h.key;
            d(e, g);
          })
          .catch(function (a) {
            g.response = a;
            g.widgetID = c;
            g.sourceWidgetID = h.key;
            d(e, g);
          });
      }
    }
    function d(a, b) {
      e(
        {
          type: "__EVENT_RESPONSE__",
          widgetOrigin: p(),
          uniqueID: h.key,
          eventName: a.eventName,
          data: b,
          promiseID: a.promiseID,
        },
        h
      );
    }
    function b(a, b, d) {
      b = a.eventHandlers[b];
      var e = [];
      if (Array.isArray(b))
        for (var c = 0; c < b.length; c++) {
          try {
            var f = b[c].call(a, d);
            var k =
              f instanceof Promise
                ? f
                    .then(function (a) {
                      return { isSuccess: !0, response: a };
                    })
                    .catch(function (a) {
                      return { isSuccess: !1, response: a };
                    })
                : { isSuccess: !0, response: f };
          } catch (q) {
            k = { isSuccess: !1, response: q };
          }
          e.push(k);
        }
      return e;
    }
    function e(b, d) {
      var e,
        c = b.isPromise;
      if (
        (c && ((e = "Promise" + t++), (b.promiseID = e)),
        d && ((b.uniqueID = (d.parentWidget || d).key), (b.widgetID = d.key)),
        (b.time = new Date().getTime()),
        r(b),
        c)
      )
        return a(e);
    }
    function a(a) {
      return new Promise(function (b, d) {
        l[a] = { resolve: b, reject: d, time: new Date().getTime() };
      });
    }
    function k() {
      r({ type: "__DEREGISTER__", uniqueID: h.key });
    }
    function r(a) {
      if (
        ("object" == typeof a && (a.widgetOrigin = encodeURIComponent(p())), !n)
      )
        throw Error("Parentwindow reference not found.");
      n.postMessage(a, w.serviceOrigin);
    }
    function p() {
      return (
        window.location.protocol +
        "//" +
        window.location.host +
        window.location.pathname
      );
    }
    var h,
      n,
      v,
      x = ZSDKUtil.getLogger(),
      t = 100,
      l = {},
      w = ZSDKUtil.GetQueryParams();
    return (
      (c.Init = function (a) {
        h = a;
        window.addEventListener("message", f);
        window.addEventListener("unload", k);
      }),
      (c.SendEvent = e),
      c
    );
  })(window.ZSDKMessageManager || {});
window.ZSDK = (function () {
  function c(d) {
    this.serviceOrigin = d.serviceOrigin || g.serviceOrigin;
    this.parentWidget = d.parentWidget;
    this.key = d.key;
    this._isRegistered = !1;
    this._childWidgets = {};
    this.eventHandlers = Object.create(null);
    this.meta;
  }
  var f,
    g = ZSDKUtil.GetQueryParams();
  return (
    (c.prototype.on = function (d, b) {
      if ("string" != typeof d)
        throw Error("Invalid eventname parameter passed.");
      if ("function" != typeof b)
        throw Error("Invalid function parameter passed.");
      var e = this.eventHandlers[d];
      if (
        (Array.isArray(e) || (this.eventHandlers[d] = e = []),
        e.push(b),
        "Load" !== d)
      ) {
        var a = { type: "__EVENT_BIND__", eventName: d, count: e.length };
        (this.parentWidget && !this.parentWidget.isRegistered()) ||
        (!this.parentWidget && !this.isRegistered())
          ? (this.parentWidget || this).on("Load", function () {
              ZSDKMessageManager.SendEvent(a, this);
            })
          : ZSDKMessageManager.SendEvent(a, this);
      }
    }),
    (c.prototype.off = function (d, b) {
      if ("string" != typeof d)
        throw Error("Invalid eventname parameter passed.");
      if ("function" != typeof b)
        throw Error("Invalid function parameter passed.");
      d = this.eventHandlers[d];
      if (Array.isArray(d)) {
        var e,
          a = [];
        for (e = 0; e < d.length; e++) d[e] === b && a.push(e);
        for (; a.length; ) d.splice(a.pop(), 1);
      }
    }),
    (c.prototype._sendEvent = function (d, b, e) {
      return ZSDKMessageManager.SendEvent(
        { type: "__EVENT__", eventName: d, data: b, isPromise: e },
        this
      );
    }),
    (c.prototype.emit = function (d, b) {
      ZSDKMessageManager.SendEvent(
        { type: "__EMIT__", eventName: d, data: b },
        this
      );
    }),
    (c.prototype.isRegistered = function () {
      return this._isRegistered;
    }),
    (c.prototype.fetch = function (d) {
      return ZSDKMessageManager.SendEvent(
        { eventName: "__HTTP__", isPromise: !0, options: d },
        this
      );
    }),
    (c.prototype.createInstance = function (d) {
      return ZSDKMessageManager.SendEvent(
        { eventName: "__CREATE_INSTANCE__", isPromise: !0, options: d },
        this
      );
    }),
    (c.prototype.modal = function (d) {
      return (
        "object" == typeof d && (d.location = "__MODAL__"),
        this.createInstance(d)
      );
    }),
    (c.prototype.getWidgets = function () {
      return ZSDKMessageManager.SendEvent(
        { eventName: "__WIDGETS_INFO__", isPromise: !0 },
        this
      );
    }),
    (c.prototype.getWidgetInstance = function (d) {
      if ("string" != typeof d) throw Error("Invalid WidgetID passed");
      if (this.parentWidget) return this.parentWidget.getWidgetInstance(d);
      var b = this._childWidgets[d];
      return (
        b ||
          (this._childWidgets[d] = b = new c({ key: d, parentWidget: this })),
        b
      );
    }),
    (c.prototype.getFileObject = function (d) {
      return new File([d.slice(0, d.size)], d.name, { type: d.type });
    }),
    {
      Init: function () {
        return (
          f ||
          ((f = new c({ serviceOrigin: g.serviceOrigin })),
          ZSDKMessageManager.Init(f),
          f)
        );
      },
      _getRootInstance: function () {
        return f;
      },
    }
  );
})();
window.SigmaSDK = (function () {
  function c(a) {
    this._serviceName = a;
  }
  var f,
    g = function () {
      if (!f.isRegistered()) throw Error("App not registered.");
    },
    d = function (a, b) {
      return f._sendEvent("SIGMA_" + a + "_EVENT", b, !0);
    },
    b = function (a, b) {
      return Promise.reject({ type: a, message: b });
    };
  c.prototype.isRegistered = function () {
    return f.isRegistered();
  };
  c.prototype.context = function () {
    return g(), f;
  };
  c.prototype.createWidget = function (a) {
    return g(), f.createInstance(a);
  };
  c.prototype.getWidget = function (a) {
    return f.getWidgetInstance(a);
  };
  c.prototype.widgetsMeta = function () {
    return g(), f.getWidgets();
  };
  c.prototype.on = function (a, b) {
    return f.on(a, b);
  };
  c.prototype.off = function (a, b) {
    return f.off(a, b);
  };
  c.prototype.trigger = function (a, b) {
    return g(), f.emit(a, b);
  };
  c.prototype.modal = function (a) {
    return g(), f.modal(a);
  };
  c.prototype.fetch = function (a) {
    return g(), f.fetch(a);
  };
  c.prototype.get = function (a) {
    if ((g(), "string" != typeof a && !Array.isArray(a)))
      return b(
        "VALIDATION_ERROR",
        "The get method accepts String or Array of Strings only."
      );
    a = "string" == typeof a ? [a] : a;
    return 0 >= a.length
      ? b(
          "VALIDATION_ERROR",
          "The get method should not accept empty Array of Strings."
        )
      : d(this._serviceName, { event_type: "get", properties: a });
  };
  c.prototype.getAll = function (a, e) {
    return (g(), "string" != typeof a)
      ? b(
          "VALIDATION_ERROR",
          "The getAll method accepts module_name as String only."
        )
      : d(this._serviceName, {
          event_type: "get_all",
          module_name: a,
          options: e,
        });
  };
  c.prototype.set = function (a, e) {
    if ((g(), "string" != typeof a && "object" != typeof a && Array.isArray(a)))
      return b(
        "VALIDATION_ERROR",
        "The set method accepts key-value pair or Object of key-value pairs only."
      );
    var c;
    return ("string" == typeof a ? ((c = {}), (c[a] = e)) : (c = a),
    0 >= c.keys.length)
      ? b("VALIDATION_ERROR", "The set method should not accept empty Object.")
      : d(this._serviceName, { event_type: "get_all", properties: c });
  };
  c.prototype.remove = function (a) {
    if ((g(), "string" != typeof a && !Array.isArray(a)))
      return b(
        "VALIDATION_ERROR",
        "The remove method accepts String or Array of Strings only."
      );
    a = "string" == typeof a ? [a] : a;
    return 0 >= a.length
      ? b(
          "VALIDATION_ERROR",
          "The remove method should not accept empty Array of Strings."
        )
      : d(this._serviceName, { event_type: "remove", properties: a });
  };
  c.prototype.request = function (a) {
    if ((g(), !a.url || 0 >= a.url.trim().length))
      return b("VALIDATION_ERROR", "The parameter url should not be empty");
    if ("string" != typeof a.url)
      return b(
        "VALIDATION_ERROR",
        "The parameter url should be type of string"
      );
    if (
      (a.method || (a.method = "GET"),
      a.params && "object" != typeof a.params && Array.isArray(a.params))
    )
      return b(
        "VALIDATION_ERROR",
        "The parameter params should be type of object"
      );
    if (a.headers && "object" != typeof a.headers && Array.isArray(a.headers))
      return b(
        "VALIDATION_ERROR",
        "The parameter headers should be type of object"
      );
    if (a.files) {
      if ("object" != typeof a.files || Array.isArray(a.files))
        return b(
          "VALIDATION_ERROR",
          "The parameter files should be type of object"
        );
      if (5 < Object.keys(a.files).length)
        return b(
          "VALIDATION_ERROR",
          "You can upload a maximum of 5 files at a time."
        );
      for (var e = 0; e < a.files.length; e++)
        a.files[e] = f.getFileObject(a.files[e]);
    }
    return d(this._serviceName, { event_type: "request", options: a });
  };
  c.prototype.requestapiconnection = function (a) {
    if ((g(), !a.api_namespace || 0 >= a.api_namespace.trim().length))
      return b(
        "VALIDATION_ERROR",
        "The parameter api_namespace should not be empty"
      );
    if ("string" != typeof a.api_namespace)
      return b(
        "VALIDATION_ERROR",
        "The parameter api_namespace should be type of string"
      );
    if (!a.url || 0 >= a.url.trim().length)
      return b("VALIDATION_ERROR", "The parameter url should not be empty");
    if ("string" != typeof a.url)
      return b(
        "VALIDATION_ERROR",
        "The parameter url should be type of string"
      );
    if (
      (a.method || (a.method = "GET"),
      a.params && "object" != typeof a.params && Array.isArray(a.params))
    )
      return b(
        "VALIDATION_ERROR",
        "The parameter params should be type of object"
      );
    if (a.headers && "object" != typeof a.headers && Array.isArray(a.headers))
      return b(
        "VALIDATION_ERROR",
        "The parameter headers should be type of object"
      );
    if (a.files) {
      if ("object" != typeof a.files || Array.isArray(a.files))
        return b(
          "VALIDATION_ERROR",
          "The parameter files should be type of object"
        );
      if (5 < Object.keys(a.files).length)
        return b(
          "VALIDATION_ERROR",
          "You can upload a maximum of 5 files at a time."
        );
      for (var e = 0; e < a.files.length; e++)
        a.files[e] = f.getFileObject(a.files[e]);
    }
    return d(this._serviceName, {
      event_type: "requestapiconnection",
      options: a,
    });
  };
  c.prototype.dispatch = function (a, b) {
    g();
    return d(this._serviceName, { event_type: a, options: b });
  };
  var e = function (a) {
    return (
      (f = window.ZSDK.Init()),
      "function" == typeof a && (f.isRegistered() ? a.call() : f.on("Load", a)),
      new c(this._serviceName)
    );
  };
  return {
    CRM: { init: e.bind({ _serviceName: "CRM" }) },
    DESK: { init: e.bind({ _serviceName: "DESK" }) },
    PROJECTS: { init: e.bind({ _serviceName: "PROJECTS" }) },
    ORCHESTLY: { init: e.bind({ _serviceName: "ORCHESTLY" }) },
    MAIL: { init: e.bind({ _serviceName: "MAIL" }) },
    SHOW: { init: e.bind({ _serviceName: "SHOW" }) },
    SDP: { init: e.bind({ _serviceName: "SDP" }) },
    IOT: { init: e.bind({ _serviceName: "IOT" }) },
    CATALYST: { init: e.bind({ _serviceName: "CATALYST" }) },
    FINANCE: { init: e.bind({ _serviceName: "FINANCE" }) },
    CONNECT: { init: e.bind({ _serviceName: "CONNECT" }) },
    TEAMINBOX: { init: e.bind({ _serviceName: "TEAMINBOX" }) },
    SPRINTS: { init: e.bind({ _serviceName: "SPRINTS" }) },
    BUGTRACKER: { init: e.bind({ _serviceName: "BUGTRACKER" }) },
    CREATOR: { init: e.bind({ _serviceName: "CREATOR" }) },
    PEOPLE: { init: e.bind({ _serviceName: "PEOPLE" }) },
    COMMERCE: { init: e.bind({ _serviceName: "COMMERCE" }) },
    SITES: { init: e.bind({ _serviceName: "SITES" }) },
    RECRUIT: { init: e.bind({ _serviceName: "RECRUIT" }) },
    WORKDRIVE: { init: e.bind({ _serviceName: "WORKDRIVE" }) },
    WRITER: { init: e.bind({ _serviceName: "WRITER" }) },
    INVOICE: { init: e.bind({ _serviceName: "INVOICE" }) },
    INVENTORY: { init: e.bind({ _serviceName: "INVENTORY" }) },
    SUBSCRIPTIONS: { init: e.bind({ _serviceName: "SUBSCRIPTIONS" }) },
    CAMPAIGNS: { init: e.bind({ _serviceName: "CAMPAIGNS" }) },
    CHARMHEALTHEHR: { init: e.bind({ _serviceName: "CHARMHEALTHEHR" }) },
    BIGIN: { init: e.bind({ _serviceName: "BIGIN" }) },
  };
})();
var ZCSDK = new (function () {
    var c = !1,
      f,
      g = void 0,
      d = {};
    this._init = function () {
      if (!c) {
        c = !0;
        f = new ZSDK();
        d.appSDK = f;
        var b;
        g = new Promise(function (e, a) {
          b = e;
        });
        f.OnLoad(function () {
          f.getContext()
            .Event.Trigger("GET_INIT_PARAMS", !0, !0)
            .then(function (e) {
              d.initParams = e;
              f.getContext()
                .Event.Trigger("GET_QUERY_PARAMS", !0, !0)
                .then(function (a) {
                  d.queryParams = a;
                  b();
                });
            });
        });
      }
      return g;
    };
    this._getInitParams = function () {
      return d.initParams;
    };
    this._getQueryParams = function () {
      return d.queryParams;
    };
    this._getApi = function () {
      return { API: { RECORDS: new Records(d) }, UTIL: new Util(d) };
    };
  })(),
  ZOHO = new (function () {
    var c = !1,
      f = new ZSDK.Init(),
      g = void 0,
      d = void 0,
      b = {},
      e;
    g = new Promise(function (a, b) {
      e = a;
    });
    f.on("Load", function () {
      e();
    });
    return {
      CREATOR: {
        API: new Records(b),
        UTIL: new Util(b),
        init: function () {
          if (!c) {
            var a;
            d = new Promise(function (b, e) {
              a = b;
            });
            g.then(function () {
              c = !0;
              b.appSDK = f;
              f._sendEvent("GET_INIT_PARAMS", !0, !0).then(function (e) {
                b.initParams = e;
                f._sendEvent("GET_QUERY_PARAMS", !0, !0).then(function (e) {
                  b.queryParams = e;
                  a();
                });
              });
            }).catch(function () {});
          }
          return d;
        },
      },
    };
  })();
function Records(c) {
  function f(b) {
    b.scope || (b.scope = c.initParams.scope);
    b.envUrlFragment ||
      (b.envUrlFragment = c.initParams.envUrlFragment.substr(1));
    b.appName || (b.appName = c.initParams.appLinkName);
  }
  function g(b, e) {
    var a = !1,
      d;
    for (d in b) {
      var c;
      if ((c = !(e && e.includes(d)))) {
        c = b[d];
        var f = !1,
          g;
        if (
          !(g =
            !c ||
            null == c ||
            "" === c ||
            ("string" == typeof c && 0 == c.trim().length)) &&
          (g = "object" == typeof c)
        )
          a: {
            g = void 0;
            for (g in c) {
              g = !1;
              break a;
            }
            g = !0;
          }
        g && (f = !0);
        c = f;
      }
      c && (a = !0);
    }
    return a;
  }
  function d(b) {
    return new Promise(function (e, a) {
      var c = new FileReader();
      c.readAsDataURL(b);
      c.onload = function () {
        e(c.result);
      };
      c.onerror = function (b) {
        a(b);
      };
    });
  }
  return {
    addRecord: function (b) {
      if (g(b))
        return new Promise(function (b, a) {
          a("Improper Configuration..!!");
        });
      f(b);
      return c.appSDK._sendEvent(
        "ADD_RECORD",
        { appLinkName: b.appName, formLinkName: b.formName, body: b.data },
        !0
      );
    },
    updateRecord: function (b) {
      if (g(b))
        return new Promise(function (a, b) {
          b("Improper Configuration..!!");
        });
      var e = b.id.toString().split(",");
      f(b);
      return c.appSDK._sendEvent(
        "EDIT_RECORDS",
        {
          appLinkName: b.appName,
          viewLinkName: b.reportName,
          body: b.data,
          listOfRecords: e,
        },
        !0
      );
    },
    deleteRecord: function (b) {
      if (g(b))
        return new Promise(function (b, a) {
          a("Improper Configuration..!!");
        });
      f(b);
      return c.appSDK._sendEvent(
        "DELETE_RECORDS",
        {
          appLinkName: b.appName,
          viewLinkName: b.reportName,
          criteria: b.criteria,
        },
        !0
      );
    },
    getRecordById: function (b) {
      if (g(b))
        return new Promise(function (b, a) {
          a("Improper Configuration..!!");
        });
      f(b);
      return c.appSDK._sendEvent(
        "GET_RECORD",
        { appLinkName: b.appName, viewLinkName: b.reportName, id: b.id },
        !0
      );
    },
    getAllRecords: function (b) {
      if (g(b, ["criteria", "page", "pageSize"]))
        return new Promise(function (b, a) {
          a("Improper Configuration..!!");
        });
      f(b);
      return c.appSDK._sendEvent(
        "GET_RECORDS",
        {
          appLinkName: b.appName,
          viewLinkName: b.reportName,
          criteria: b.criteria,
          page: b.page,
          pageSize: b.pageSize,
        },
        !0
      );
    },
    uploadFile: function (b) {
      if (g(b, ["file", "parentId"]))
        return new Promise(function (b, a) {
          a("Improper Configuration..!!");
        });
      f(b);
      return b.file
        ? b.file.size && 50 < b.file.size / 1024 / 1024
          ? new Promise(function (b, a) {
              a("Improper Configuration..!!");
            })
          : new Promise(function (e, a) {
              var f = d(b.file),
                g = "",
                p = b.file.name;
              f.then(function (d) {
                g = d;
                d = {
                  appLinkName: b.appName,
                  viewLinkName: b.reportName,
                  id: b.id,
                  fieldName: b.fieldName,
                  file: g,
                  fileName: p,
                };
                b.parentId && (d.parentId = b.parentId);
                c.appSDK
                  ._sendEvent("UPLOAD_FILE", d, !0)
                  .then(function (a) {
                    e(a);
                  })
                  .catch(function (b) {
                    a(b);
                  });
              }).catch(function (b) {
                a(b);
              });
            })
        : new Promise(function (b, a) {
            a("Improper Configuration..!!");
          });
    },
  };
}
function Util(c) {
  return {
    setImageData: function (f, g, d) {
      if (g.startsWith("/api/v2/")) {
        var b = {};
        b.src = g;
        c.appSDK
          ._sendEvent("IMAGE_LOAD", b, !0)
          .then(function (b) {
            f.setAttribute("src", b);
            d({ status: "200", statusText: "success" });
          })
          .catch(function (b) {
            if (d) d(b);
            else {
              var a = window.console;
              a.log("Error: Unable to set image data");
              a.log(b);
            }
          });
      } else f.setAttribute("src", g);
    },
    getInitParams: function () {
      return c.initParams;
    },
    getQueryParams: function () {
      return c.queryParams;
    },
    navigateParentURL: function (f) {
      return f && f.action
        ? c.appSDK._sendEvent("PARENT_NAVIGATION", f, !0)
        : new Promise(function (c, d) {
            d("Improper Configuration..!!");
          });
    },
  };
}
