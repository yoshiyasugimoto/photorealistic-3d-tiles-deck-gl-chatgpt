import * as THREE from 'three'
import Long from './long.js'

export const SturfeeXRConfig = /** @class */ (function () {
  function SturfeeXRConfig() {}
  return SturfeeXRConfig
})()
var MeshType
;(function (MeshType) {
  MeshType['GLTF'] = 'gltf'
  MeshType['OBJ'] = 'obj'
})(MeshType || (MeshType = {}))

var ProviderState
;(function (ProviderState) {
  ProviderState['Initializing'] = 'initializing'
  ProviderState['Ready'] = 'ready'
  ProviderState['NotSupported'] = 'notSupported'
})(ProviderState || (ProviderState = {}))

var Defaults = /** @class */ (function () {
  function Defaults() {}
  Defaults.TARGET_COUNT = 8
  Defaults.ANGLE = 30
  // public static _STURFEE_API_URL:string = "api-staging.devsturfee.com/api/0.2.0";     //TODO: Public Internal
  // public static _WEBSOCKET_URL:string = "wss://api-staging.devsturfee.com/api/0.2.0/alignment/ws";     //TODO: Public Internal
  Defaults._STURFEE_API_URL = 'api.sturfee.com/api/0.2.0' //TODO: Public Internal
  Defaults._WEBSOCKET_URL = 'wss://api.sturfee.com/api/0.2.0/alignment/ws' //TODO: Public Internal
  //TODO: Change this to FOV of 65
  Defaults.XRCAMERA_PROJECTION_MATRIX = {
    e00: 2.588984407376442,
    e01: 0,
    e02: 0,
    e03: 0,
    e10: 0,
    e11: 1.457299930273459,
    e12: 0,
    e13: 0,
    e20: 0,
    e21: 0,
    e22: -1.0000100000500003,
    e23: -0.020000100000500003,
    e30: 0,
    e31: 0,
    e32: -1,
    e33: 0,
  }
  return Defaults
})()

var DeviceVideo = /** @class */ (function () {
  function DeviceVideo() {
    var _this = this
    this._providerState = ProviderState.Initializing
    this._initVideo = function (stream) {
      return new Promise(function (resolve, reject) {
        _this._canvas = document.createElement('canvas')
        var container = document.getElementById('sturfee-vps-container')
        _this._video = document.createElement('video')
        // video.classList.add('main-video');
        _this._video.setAttribute('playsinline', '')
        // video.setAttribute('muted', '');
        container.appendChild(_this._video)
        _this._video.onloadedmetadata = function () {
          _this._video.play()
        }
        _this._video.oncanplay = function () {
          _this._onVideoReady()
          resolve()
        }
        _this._video.srcObject = stream
      })
    }
    this._onVideoReady = function () {
      _this._canvas.width = window.innerWidth
      _this._canvas.height = window.innerHeight
      _this._video.setAttribute('height', _this._canvas.height.toString())
      _this._video.setAttribute('width', _this._canvas.width.toString())
    }
  }
  DeviceVideo.prototype.init = function () {
    var _this = this
    return new Promise(function (resolve, reject) {
      if (
        'mediaDevices' in navigator &&
        'getUserMedia' in navigator.mediaDevices
      ) {
        console.log('Initializing camera...')
        navigator.mediaDevices
          .getUserMedia({
            video: {
              width: {
                min: 1280,
                ideal: 1280,
                max: 1920,
              },
              height: {
                min: 720,
                ideal: 720,
                max: 1080,
              },
              facingMode: 'environment', // 'user' = front facing camera
            },
          })
          .then(function (stream) {
            _this._initVideo(stream).then(function () {
              _this._providerState = ProviderState.Ready
              console.log(' Video ready...')
              resolve(true)
            })
          })
          .catch(function (error) {
            reject(error)
          })
      } else {
        console.log('ERROR: Camera not supported by browser')
        _this._providerState = ProviderState.NotSupported
        reject(false)
      }
      _this._getDeviceName().then(function (device) {
        _this._deviceName = device.name
        _this
          ._getCalibratedData()
          .then(function (pm) {
            return (_this._projectionMatrix = pm)
          })
          .catch(function (err) {
            return console.error(err)
          })
      })
    })
  }
  DeviceVideo.prototype.status = function () {
    return this._providerState
  }
  DeviceVideo.prototype.getCurrentImage = function () {
    var _this = this
    return new Promise(function (resolve, reject) {
      var context = _this._canvas.getContext('2d')
      context.drawImage(
        _this._video,
        0,
        0,
        _this._canvas.width,
        _this._canvas.height
      )
      var fileReader = new FileReader()
      fileReader.addEventListener('loadend', function () {
        if (fileReader.error) {
          reject(fileReader.error)
        } else {
          resolve(fileReader.result)
        }
      })
      _this._canvas.toBlob(function (blob) {
        fileReader.readAsArrayBuffer(blob)
        // console.log('saving image...');
        // let a = document.createElement('a');
        // let url = URL.createObjectURL(blob);
        // a.href = url;
        // a.target = '_blank';
        // a.download = 'photo.jpg';
        // a.click();
      }, 'image/jpeg')
    })
  }
  DeviceVideo.prototype.getCurrentImageBlob = function () {
    var _this = this
    return new Promise(function (resolve, reject) {
      var context = _this._canvas.getContext('2d')
      context.drawImage(
        _this._video,
        0,
        0,
        _this._canvas.width,
        _this._canvas.height
      )
      _this._canvas.toBlob(function (blob) {
        resolve(blob)
      }, 'image/jpeg')
    })
  }
  DeviceVideo.prototype.getProjectionMatrix = function () {
    if (this._projectionMatrix != null) {
      return this._projectionMatrix
    }
    return Defaults.XRCAMERA_PROJECTION_MATRIX
  }
  DeviceVideo.prototype.getWidth = function () {
    return this._video.width
  }
  DeviceVideo.prototype.getHeight = function () {
    return this._video.height
  }
  DeviceVideo.prototype.getFOV = function () {
    return (
      2.0 * Math.atan(1.0 / this.getProjectionMatrix().e11) * (180 / Math.PI)
    )
  }
  DeviceVideo.prototype.isPortrait = function () {
    return this.getWidth() < this.getHeight()
  }
  DeviceVideo.prototype._getMobileOperatingSystem = function () {
    var userAgent = navigator.userAgent || navigator.vendor
    // Windows Phone must come first because its UA also contains "Android"
    if (/windows phone/i.test(userAgent)) {
      return 'Windows Phone'
    }
    if (/android/i.test(userAgent)) {
      return 'Android'
    }
    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return 'iOS'
    }
    return 'unknown'
  }
  DeviceVideo.prototype._getCalibratedData = function () {
    var _this = this
    var url = 'https://webvps-data-recorder.s3.amazonaws.com/calibrated-data'
    return fetch(url + '/' + this._deviceName + '.txt').then(function (
      response
    ) {
      if (!response.ok) {
        console.log(_this._deviceName + ' is not yet calibrated for VPS')
        return null
      }
      console.log('response ok')
      return response.json()
    })
  }
  DeviceVideo.prototype._getDeviceName = function () {
    var url =
      'https://api.userstack.com/detect' +
        '?access_key=' +
        'c1e2606996869dc8ee1215380c3b2a2f' +
        '&ua=' +
        navigator.userAgent || navigator.vendor
    return fetch(url).then(function (response) {
      if (!response.ok) {
        throw new Error(response.statusText)
      }
      return response.json()
    })
  }
  return DeviceVideo
})()

var DeviceGPS = /** @class */ (function () {
  function DeviceGPS() {
    this._providerState = ProviderState.Initializing
  }
  DeviceGPS.prototype.init = function () {
    var _this = this
    console.log('Initializing GPS Sesnor...')
    return new Promise(function (resolve, reject) {
      if (navigator.geolocation) {
        var options = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0, // must not use cached position
        }
        navigator.geolocation.watchPosition(
          function (location) {
            _this._providerState = ProviderState.Ready
            _this._currentLocation = location
            resolve(true)
          },
          function (error) {
            _this._providerState = ProviderState.NotSupported
            reject(_this._getErrorMessage(error))
          },
          options
        )
      } else {
        console.log('Geolocation is not supported by this browser.')
        _this._providerState = ProviderState.NotSupported
        reject(false) //`GPS Failed to Initialize`);
      }
    })
  }
  DeviceGPS.prototype.status = function () {
    return this._providerState
  }
  DeviceGPS.prototype.getCurrentLocation = function () {
    if (!this._currentLocation) {
      throw 'GPS :: Location not ready'
    }
    return this._currentLocation
  }
  DeviceGPS.prototype._getErrorMessage = function (error) {
    var msg = ''
    switch (error.code) {
      case error.PERMISSION_DENIED:
        msg = 'User denied the request for Geolocation.'
        break
      case error.POSITION_UNAVAILABLE:
        msg = 'Location information is unavailable.'
        break
      case error.TIMEOUT:
        msg = 'The request to get user location timed out.'
        break
      default:
        msg = 'An unknown error occurred.'
        break
    }
    console.error(msg)
    return msg
  }
  return DeviceGPS
})()

var MathUtils = /** @class */ (function () {
  function MathUtils() {}
  MathUtils.clamp = function (value, min, max) {
    return Math.max(min, Math.min(max, value))
  }
  MathUtils.degToRad = function (degrees) {
    return degrees * MathUtils.DEG2RAD
  }
  MathUtils.radToDeg = function (radians) {
    return radians * MathUtils.RAD2DEG
  }
  MathUtils.isPortrait = function (screenOrientation) {
    if (screenOrientation === -90 || screenOrientation === 90) {
      return 0
    }
    return 1
  }
  MathUtils.DEG2RAD = Math.PI / 180
  MathUtils.RAD2DEG = 180 / Math.PI
  return MathUtils
})()

var Vector3 = /** @class */ (function () {
  function Vector3(x, y, z) {
    this._quaternion = new Quaternion()
    this.x = x || 0
    this.y = y || 0
    this.z = z || 0
  }
  Vector3.prototype.applyEuler = function (euler) {
    return this.applyQuaternion(this._quaternion.setFromEuler(euler))
  }
  Vector3.prototype.applyAxisAngle = function (axis, angle) {
    return this.applyQuaternion(this._quaternion.setFromAxisAngle(axis, angle))
  }
  Vector3.prototype.applyMatrix4 = function (m) {
    var x = this.x,
      y = this.y,
      z = this.z
    var e = m.elements
    var w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15])
    this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w
    this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w
    this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w
    return this
  }
  Vector3.prototype.applyQuaternion = function (q) {
    var x = this.x,
      y = this.y,
      z = this.z
    var qx = q.x,
      qy = q.y,
      qz = q.z,
      qw = q.w
    // calculate quat * vector
    var ix = qw * x + qy * z - qz * y
    var iy = qw * y + qz * x - qx * z
    var iz = qw * z + qx * y - qy * x
    var iw = -qx * x - qy * y - qz * z
    // calculate result * inverse quat
    this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy
    this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz
    this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx
    return this
  }
  Vector3.prototype.dot = function (v) {
    return this.x * v.x + this.y * v.y + this.z * v.z
  }
  Vector3.prototype.lengthSq = function () {
    return this.x * this.x + this.y * this.y + this.z * this.z
  }
  Vector3.prototype.length = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
  }
  Vector3.prototype.manhattanLength = function () {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z)
  }
  Vector3.prototype.normalize = function () {
    return this.divideScalar(this.length() || 1)
  }
  Vector3.prototype.multiplyScalar = function (scalar) {
    this.x *= scalar
    this.y *= scalar
    this.z *= scalar
    return this
  }
  Vector3.prototype.divideScalar = function (scalar) {
    return this.multiplyScalar(1 / scalar)
  }
  Vector3.prototype.cross = function (v) {
    return this.crossVectors(this, v)
  }
  Vector3.prototype.crossVectors = function (a, b) {
    var ax = a.x,
      ay = a.y,
      az = a.z
    var bx = b.x,
      by = b.y,
      bz = b.z
    this.x = ay * bz - az * by
    this.y = az * bx - ax * bz
    this.z = ax * by - ay * bx
    return this
  }
  Vector3.prototype.angleTo = function (v) {
    var denominator = Math.sqrt(this.lengthSq() * v.lengthSq())
    if (denominator === 0)
      console.error(
        "THREE.Vector3: angleTo() can't handle zero length vectors."
      )
    var theta = this.dot(v) / denominator
    return Math.acos(MathUtils.clamp(theta, -1, 1))
  }
  return Vector3
})()

var Matrix4 = /** @class */ (function () {
  function Matrix4() {
    this._zero = new Vector3(0, 0, 0)
    this._one = new Vector3(1, 1, 1)
    this.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  }
  Matrix4.prototype.identity = function () {
    throw new Error('Method not implemented.')
  }
  Matrix4.prototype.copy = function (m) {
    throw new Error('Method not implemented.')
  }
  Matrix4.prototype.multiplyScalar = function (s) {
    throw new Error('Method not implemented.')
  }
  Matrix4.prototype.determinant = function () {
    throw new Error('Method not implemented.')
  }
  Matrix4.prototype.getInverse = function (matrix, throwOnInvertible) {
    throw new Error('Method not implemented.')
  }
  Matrix4.prototype.transpose = function () {
    throw new Error('Method not implemented.')
  }
  Matrix4.prototype.clone = function () {
    throw new Error('Method not implemented.')
  }
  Matrix4.prototype.makeRotationFromQuaternion = function (q) {
    return this.compose(this._zero, q, this._one)
  }
  Matrix4.prototype.compose = function (position, quaternion, scale) {
    var te = this.elements
    var x = quaternion.x,
      y = quaternion.y,
      z = quaternion.z,
      w = quaternion.w
    var x2 = x + x,
      y2 = y + y,
      z2 = z + z
    var xx = x * x2,
      xy = x * y2,
      xz = x * z2
    var yy = y * y2,
      yz = y * z2,
      zz = z * z2
    var wx = w * x2,
      wy = w * y2,
      wz = w * z2
    var sx = scale.x,
      sy = scale.y,
      sz = scale.z
    te[0] = (1 - (yy + zz)) * sx
    te[1] = (xy + wz) * sx
    te[2] = (xz - wy) * sx
    te[3] = 0
    te[4] = (xy - wz) * sy
    te[5] = (1 - (xx + zz)) * sy
    te[6] = (yz + wx) * sy
    te[7] = 0
    te[8] = (xz + wy) * sz
    te[9] = (yz - wx) * sz
    te[10] = (1 - (xx + yy)) * sz
    te[11] = 0
    te[12] = position.x
    te[13] = position.y
    te[14] = position.z
    te[15] = 1
    return this
  }
  return Matrix4
})()

var Quaternion = /** @class */ (function () {
  function Quaternion(x, y, z, w) {
    var _this = this
    this.set = function (x, y, z, w) {
      _this.x = x
      _this.y = y
      _this.z = z
      _this.w = w
      return _this
    }
    this.setFromEuler = function (euler) {
      var result = Quaternion.fromEuler(euler)
      _this.x = result.x
      _this.y = result.y
      _this.z = result.z
      _this.w = result.w
      return _this
    }
    this.multiply = function (q) {
      var result = Quaternion.multiplyQuaternions(_this, q)
      _this.x = result.x
      _this.y = result.y
      _this.z = result.z
      _this.w = result.w
      return _this
    }
    this.setFromAxisAngle = function (axis, angle) {
      var halfAngle = angle / 2,
        s = Math.sin(halfAngle)
      _this.x = axis.x * s
      _this.y = axis.y * s
      _this.z = axis.z * s
      _this.w = Math.cos(halfAngle)
      return _this
    }
    this.x = x || 0
    this.y = y || 0
    this.z = z || 0
    this.w = w || 1
  }
  Quaternion.fromEuler2 = function (phi, theta, psi, order) {
    var x = theta * 0.5
    var y = psi * 0.5
    var z = phi * 0.5
    var cX = Math.cos(x)
    var cY = Math.cos(y)
    var cZ = Math.cos(z)
    var sX = Math.sin(x)
    var sY = Math.sin(y)
    var sZ = Math.sin(z)
    if (order === undefined || order === 'ZXY') {
      return new Quaternion(
        cX * cY * cZ - sX * sY * sZ,
        sX * cY * cZ - cX * sY * sZ,
        cX * sY * cZ + sX * cY * sZ,
        cX * cY * sZ + sX * sY * cZ
      )
    }
    if (order === 'XYZ') {
      return new Quaternion(
        cX * cY * cZ - sX * sY * sZ,
        sX * cY * cZ + cX * sY * sZ,
        cX * sY * cZ - sX * cY * sZ,
        cX * cY * sZ + sX * sY * cZ
      )
    }
    if (order === 'YXZ') {
      return new Quaternion(
        cX * cY * cZ + sX * sY * sZ,
        sX * cY * cZ + cX * sY * sZ,
        cX * sY * cZ - sX * cY * sZ,
        cX * cY * sZ - sX * sY * cZ
      )
    }
    if (order === 'ZYX') {
      return new Quaternion(
        cX * cY * cZ + sX * sY * sZ,
        sX * cY * cZ - cX * sY * sZ,
        cX * sY * cZ + sX * cY * sZ,
        cX * cY * sZ - sX * sY * cZ
      )
    }
    if (order === 'YZX') {
      return new Quaternion(
        cX * cY * cZ - sX * sY * sZ,
        sX * cY * cZ + cX * sY * sZ,
        cX * sY * cZ + sX * cY * sZ,
        cX * cY * sZ - sX * sY * cZ
      )
    }
    if (order === 'XZY') {
      return new Quaternion(
        cX * cY * cZ + sX * sY * sZ,
        sX * cY * cZ - cX * sY * sZ,
        cX * sY * cZ - sX * cY * sZ,
        cX * cY * sZ + sX * sY * cZ
      )
    }
    return null
  }
  Quaternion.multiplyQuaternions = function (a, b) {
    var qax = a.x,
      qay = a.y,
      qaz = a.z,
      qaw = a.w
    var qbx = b.x,
      qby = b.y,
      qbz = b.z,
      qbw = b.w
    return new Quaternion(
      qax * qbw + qaw * qbx + qay * qbz - qaz * qby,
      qay * qbw + qaw * qby + qaz * qbx - qax * qbz,
      qaz * qbw + qaw * qbz + qax * qby - qay * qbx,
      qaw * qbw - qax * qbx - qay * qby - qaz * qbz
    )
  }
  Quaternion.inverse = function (q) {
    var result = new Quaternion()
    result.x = -q.x
    result.y = -q.y
    result.z = -q.z
    result.w = q.w
    return result
  }
  Quaternion.fromEuler = function (euler) {
    var result = new Quaternion()
    var x = euler.x,
      y = euler.y,
      z = euler.z,
      order = euler.order
    var cos = Math.cos
    var sin = Math.sin
    var c1 = cos(x / 2)
    var c2 = cos(y / 2)
    var c3 = cos(z / 2)
    var s1 = sin(x / 2)
    var s2 = sin(y / 2)
    var s3 = sin(z / 2)
    if (order === 'XYZ') {
      result.x = s1 * c2 * c3 + c1 * s2 * s3
      result.y = c1 * s2 * c3 - s1 * c2 * s3
      result.z = c1 * c2 * s3 + s1 * s2 * c3
      result.w = c1 * c2 * c3 - s1 * s2 * s3
    } else if (order === 'YXZ') {
      result.x = s1 * c2 * c3 + c1 * s2 * s3
      result.y = c1 * s2 * c3 - s1 * c2 * s3
      result.z = c1 * c2 * s3 - s1 * s2 * c3
      result.w = c1 * c2 * c3 + s1 * s2 * s3
    } else if (order === 'ZXY') {
      result.x = s1 * c2 * c3 - c1 * s2 * s3
      result.y = c1 * s2 * c3 + s1 * c2 * s3
      result.z = c1 * c2 * s3 + s1 * s2 * c3
      result.w = c1 * c2 * c3 - s1 * s2 * s3
    } else if (order === 'ZYX') {
      result.x = s1 * c2 * c3 - c1 * s2 * s3
      result.y = c1 * s2 * c3 + s1 * c2 * s3
      result.z = c1 * c2 * s3 - s1 * s2 * c3
      result.w = c1 * c2 * c3 + s1 * s2 * s3
    } else if (order === 'YZX') {
      result.x = s1 * c2 * c3 + c1 * s2 * s3
      result.y = c1 * s2 * c3 + s1 * c2 * s3
      result.z = c1 * c2 * s3 - s1 * s2 * c3
      result.w = c1 * c2 * c3 - s1 * s2 * s3
    } else if (order === 'XZY') {
      result.x = s1 * c2 * c3 - c1 * s2 * s3
      result.y = c1 * s2 * c3 - s1 * c2 * s3
      result.z = c1 * c2 * s3 + s1 * s2 * c3
      result.w = c1 * c2 * c3 + s1 * s2 * s3
    }
    return result
  }
  Quaternion.getEuler = function (quaternion) {
    var rotmax = Quaternion._makeRotationFromQuaternion(quaternion)
    var eulerInRad = Quaternion._getEulerFromRotationMatrix(rotmax)
    var euler = new Vector3(
      radians_to_degrees(eulerInRad.x),
      radians_to_degrees(eulerInRad.y),
      radians_to_degrees(eulerInRad.z)
    )
    return euler
  }
  Quaternion.fromQuaternion = function (other) {
    return new Quaternion(other.x, other.y, other.z, other.w)
  }
  Quaternion._getEulerFromRotationMatrix = function (rotmax) {
    //ZYX
    var m11 = rotmax.elements[0]
    var m12 = rotmax.elements[1]
    var m13 = rotmax.elements[2]
    var m21 = rotmax.elements[4]
    var m22 = rotmax.elements[5]
    var m23 = rotmax.elements[6]
    var m31 = rotmax.elements[8]
    var m32 = rotmax.elements[9]
    var m33 = rotmax.elements[10]
    var euler = new Vector3()
    euler.y = Math.asin(-clamp(m31, -1, 1))
    if (Math.abs(rotmax.elements[13]) < 0.9999) {
      euler.x = Math.atan2(m32, m33)
      euler.z = Math.atan2(m21, m11)
    } else {
      euler.x = 0
      euler.z = Math.atan2(-m12, m22)
    }
    return euler
  }
  Quaternion._makeRotationFromQuaternion = function (quaternion) {
    var mat = new Matrix4()
    var te = mat.elements
    var x = quaternion.x,
      y = quaternion.y,
      z = quaternion.z,
      w = quaternion.w
    var x2 = x + x,
      y2 = y + y,
      z2 = z + z
    var xx = x * x2,
      xy = x * y2,
      xz = x * z2
    var yy = y * y2,
      yz = y * z2,
      zz = z * z2
    var wx = w * x2,
      wy = w * y2,
      wz = w * z2
    te[0] = 1 - (yy + zz)
    te[1] = xy - wz
    te[2] = xz + wy
    te[4] = xy + wz
    te[5] = 1 - (xx + zz)
    te[6] = yz - wx
    te[8] = xz - wy
    te[9] = yz + wx
    te[10] = 1 - (xx + yy)
    mat.elements = te
    return mat
  }
  return Quaternion
})()
function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num
}
function radians_to_degrees(radians) {
  var pi = Math.PI
  return radians * (180 / pi)
}

var Euler = /** @class */ (function () {
  function Euler(x, y, z, order) {
    var _this = this
    this._quaternion = new Quaternion()
    this._matrix = new Matrix4()
    this.reorder = function (newOrder) {
      // WARNING: this discards revolution information -bhouston
      _this._quaternion = _this._quaternion.setFromEuler(_this)
      return _this.setFromQuaternion(_this._quaternion, newOrder)
    }
    this.set = function (x, y, z, order) {
      _this.x = x
      _this.y = y
      _this.z = z
      _this.order = order
    }
    this.setFromQuaternion = function (quaternion, order) {
      _this._matrix.makeRotationFromQuaternion(quaternion)
      return _this.setFromRotationMatrix(_this._matrix, order)
    }
    this.setFromRotationMatrix = function (m, order) {
      var clamp = MathUtils.clamp
      // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)
      var te = m.elements
      var m11 = te[0],
        m12 = te[4],
        m13 = te[8]
      var m21 = te[1],
        m22 = te[5],
        m23 = te[9]
      var m31 = te[2],
        m32 = te[6],
        m33 = te[10]
      order = order || _this.order
      if (order === 'XYZ') {
        _this.y = Math.asin(clamp(m13, -1, 1))
        if (Math.abs(m13) < 0.9999999) {
          _this.x = Math.atan2(-m23, m33)
          _this.z = Math.atan2(-m12, m11)
        } else {
          _this.x = Math.atan2(m32, m22)
          _this.z = 0
        }
      } else if (order === 'YXZ') {
        _this.x = Math.asin(-clamp(m23, -1, 1))
        if (Math.abs(m23) < 0.9999999) {
          _this.y = Math.atan2(m13, m33)
          _this.z = Math.atan2(m21, m22)
        } else {
          _this.y = Math.atan2(-m31, m11)
          _this.z = 0
        }
      } else if (order === 'ZXY') {
        _this.x = Math.asin(clamp(m32, -1, 1))
        if (Math.abs(m32) < 0.9999999) {
          _this.y = Math.atan2(-m31, m33)
          _this.z = Math.atan2(-m12, m22)
        } else {
          _this.y = 0
          _this.z = Math.atan2(m21, m11)
        }
      } else if (order === 'ZYX') {
        _this.y = Math.asin(-clamp(m31, -1, 1))
        if (Math.abs(m31) < 0.9999999) {
          _this.x = Math.atan2(m32, m33)
          _this.z = Math.atan2(m21, m11)
        } else {
          _this.x = 0
          _this.z = Math.atan2(-m12, m22)
        }
      } else if (order === 'YZX') {
        _this.z = Math.asin(clamp(m21, -1, 1))
        if (Math.abs(m21) < 0.9999999) {
          _this.x = Math.atan2(-m23, m22)
          _this.y = Math.atan2(-m31, m11)
        } else {
          _this.x = 0
          _this.y = Math.atan2(m13, m33)
        }
      } else if (order === 'XZY') {
        _this.z = Math.asin(-clamp(m12, -1, 1))
        if (Math.abs(m12) < 0.9999999) {
          _this.x = Math.atan2(m32, m22)
          _this.y = Math.atan2(m13, m11)
        } else {
          _this.x = Math.atan2(-m23, m33)
          _this.y = 0
        }
      } else {
        console.warn(
          'Euler: .setFromRotationMatrix() given unsupported order: ' + order
        )
      }
      _this.order = order
      return _this
    }
    this.x = x || 0
    this.y = y || 0
    this.z = z || 0
    this.order = order || 'XYZ' // Euler.DefaultOrder = 'XYZ';
  }
  return Euler
})()

var DeviceImu = /** @class */ (function () {
  function DeviceImu() {
    this._providerState = ProviderState.Initializing
  }
  DeviceImu.prototype.init = function () {
    var _this = this
    console.log('Initializing IMU Sesnor...')
    return new Promise(function (resolve, reject) {
      // Only For safari
      if (
        typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function'
      ) {
        DeviceOrientationEvent.requestPermission()
          .then(function (response) {
            if (response == 'granted') {
              getOrientation()
            }
          })
          .catch(console.error)
      } else {
        getOrientation()
      }
      var that = _this
      function getOrientation() {
        window.addEventListener(
          'deviceorientation',
          function (evt) {
            that._handleOrientationChange(evt)
            that._providerState = ProviderState.Ready
            resolve(true)
          },
          false
        )
      }
    })
  }
  DeviceImu.prototype.status = function () {
    return this._providerState
  }
  DeviceImu.prototype.getOrientation = function () {
    return this._orientation
  }
  DeviceImu.prototype.getPosition = function () {
    return new Vector3()
  }
  DeviceImu.prototype._handleOrientationChange = function (evt) {
    var alphaOffset = 0 // radians ????
    var alpha = evt.alpha ? MathUtils.degToRad(evt.alpha) + alphaOffset : 0 // Z
    var beta = evt.beta ? MathUtils.degToRad(evt.beta) : 0 // X'
    var gamma = evt.gamma ? MathUtils.degToRad(evt.gamma) : 0 // Y''
    // raw IMU
    var euler = new Euler()
    var rotation = new Quaternion(0, 0, 0, 1)
    euler.set(beta, gamma, alpha, 'ZXY') // 'ZXY' for the device
    rotation.setFromEuler(euler)
    this._orientation = rotation
  }
  DeviceImu.prototype._showPermisssionBox = function () {
    var permissions = document.createElement('div')
    permissions.setAttribute('id', 'permissions')
    var html =
      '\n        <div id="imu-permission" class="permission-box">\n            <p>Sturfee-VPS requires permission to access device motion sensors</p>\n            <div id="permission-buttons" class="permisssion-buttons-container">\n                <button id="imu-permission-cancel" class="permission-button"> Cancel </button>\n                <button id="imu-permission-continue" class="permission-button primary"> Continue </button>\n            </div>\n        </div>'
    permissions.innerHTML = html.trim()
    document.getElementById('sturfee-vps-container').appendChild(permissions)
  }
  return DeviceImu
})()

var GltfMeshClient = /** @class */ (function () {
  function GltfMeshClient(url, token) {
    this._token = token
    this._baseUrl = url
  }
  GltfMeshClient.prototype.loadMesh = function (gps) {
    var _this = this
    return new Promise(function (resolve, reject) {
      console.log('GltfMeshClient :: Loading Tiles...')
      var lat = gps.getCurrentLocation().coords.latitude
      var lng = gps.getCurrentLocation().coords.longitude
      var radius = 300
      if (!lat || !lng) {
        throw 'MeshClient :: ERROR => lat/lng values are invalid'
      }
      _this
        ._callApi(
          'https://' +
            _this._baseUrl +
            '/get_gltf/?lat=' +
            lat +
            '&lng=' +
            lng +
            '&radius=' +
            radius +
            '&token=' +
            _this._token
        )
        .then(function (data) {
          console.log(' [+] GltfMeshClient :: Tile Loaded Successfully!')
          // resolve using that data:
          resolve(data)
        })
        .catch(function (err) {
          return reject(err)
        })
    })
  }
  GltfMeshClient.prototype._callApi = function (url) {
    return fetch(url).then(function (response) {
      if (!response.ok) {
        throw new Error(response.statusText)
      }
      console.log('response ok')
      return response.json() // return response.json() as Promise<{ data: T }>;
    })
  }
  return GltfMeshClient
})()

var GpsPosition = /** @class */ (function () {
  function GpsPosition() {}
  return GpsPosition
})()
var GeoUtils = /** @class */ (function () {
  function GeoUtils() {}
  GeoUtils.latLngToUtm = function (latitude, longitude, datum) {
    // TODO: _getEllipsoid
    // this._datumName = datum || 'WGS 84';
    // this._setEllipsoid(this._datumName);
    // let _datumName = 'WGS 84';
    var a = 0
    var eccSquared = 0
    var ellipsoidConstants = this._getEllipsoid('WGS 84')
    a = ellipsoidConstants.a
    eccSquared = ellipsoidConstants.eccSquared
    var ZoneNumber = 0
    var LongTemp = longitude
    var LatRad = MathUtils.degToRad(latitude)
    var LongRad = MathUtils.degToRad(LongTemp)
    if (LongTemp >= 8 && LongTemp <= 13 && latitude > 54.5 && latitude < 58) {
      ZoneNumber = 32
    } else if (
      latitude >= 56.0 &&
      latitude < 64.0 &&
      LongTemp >= 3.0 &&
      LongTemp < 12.0
    ) {
      ZoneNumber = 32
    } else {
      ZoneNumber = (LongTemp + 180) / 6 + 1
      if (latitude >= 72.0 && latitude < 84.0) {
        if (LongTemp >= 0.0 && LongTemp < 9.0) {
          ZoneNumber = 31
        } else if (LongTemp >= 9.0 && LongTemp < 21.0) {
          ZoneNumber = 33
        } else if (LongTemp >= 21.0 && LongTemp < 33.0) {
          ZoneNumber = 35
        } else if (LongTemp >= 33.0 && LongTemp < 42.0) {
          ZoneNumber = 37
        }
      }
    }
    ZoneNumber = Math.floor(ZoneNumber)
    var LongOrigin = (ZoneNumber - 1) * 6 - 180 + 3 //+3 puts origin in middle of zone
    var LongOriginRad = MathUtils.degToRad(LongOrigin)
    var UTMZone = this._getUtmLetterDesignator(latitude)
    var eccPrimeSquared = eccSquared / (1 - eccSquared)
    var N = a / Math.sqrt(1 - eccSquared * Math.sin(LatRad) * Math.sin(LatRad))
    var T = Math.tan(LatRad) * Math.tan(LatRad)
    var C = eccPrimeSquared * Math.cos(LatRad) * Math.cos(LatRad)
    var A = Math.cos(LatRad) * (LongRad - LongOriginRad)
    var M =
      a *
      ((1 -
        eccSquared / 4 -
        (3 * eccSquared * eccSquared) / 64 -
        (5 * eccSquared * eccSquared * eccSquared) / 256) *
        LatRad -
        ((3 * eccSquared) / 8 +
          (3 * eccSquared * eccSquared) / 32 +
          (45 * eccSquared * eccSquared * eccSquared) / 1024) *
          Math.sin(2 * LatRad) +
        ((15 * eccSquared * eccSquared) / 256 +
          (45 * eccSquared * eccSquared * eccSquared) / 1024) *
          Math.sin(4 * LatRad) -
        ((35 * eccSquared * eccSquared * eccSquared) / 3072) *
          Math.sin(6 * LatRad))
    var UTMEasting =
      0.9996 *
        N *
        (A +
          ((1 - T + C) * A * A * A) / 6 +
          ((5 - 18 * T + T * T + 72 * C - 58 * eccPrimeSquared) *
            A *
            A *
            A *
            A *
            A) /
            120) +
      500000.0
    var UTMNorthing =
      0.9996 *
      (M +
        N *
          Math.tan(LatRad) *
          ((A * A) / 2 +
            ((5 - T + 9 * C + 4 * C * C) * A * A * A * A) / 24 +
            ((61 - 58 * T + T * T + 600 * C - 330 * eccPrimeSquared) *
              A *
              A *
              A *
              A *
              A *
              A) /
              720))
    if (latitude < 0) {
      UTMNorthing += 10000000.0
    }
    // UTMNorthing = (Math.round(UTMNorthing));
    // UTMEasting = (Math.round(UTMEasting));
    return {
      easting: UTMEasting,
      northing: UTMNorthing,
      zoneNumber: ZoneNumber,
      zoneLetter: UTMZone,
    }
  }
  GeoUtils.utmToLatLng = function (
    UTMEasting,
    UTMNorthing,
    UTMZoneNumber,
    UTMZoneLetter
  ) {
    var a = 0
    var eccSquared = 0
    var ellipsoidConstants = this._getEllipsoid('WGS 84')
    a = ellipsoidConstants.a
    eccSquared = ellipsoidConstants.eccSquared
    var e1 = (1 - Math.sqrt(1 - eccSquared)) / (1 + Math.sqrt(1 - eccSquared))
    var x = UTMEasting - 500000.0 //remove 500,000 meter offset for longitude
    var y = UTMNorthing
    var ZoneNumber = UTMZoneNumber
    var ZoneLetter = UTMZoneLetter
    if (UTMEasting === undefined) {
      throw 'Please pass the UTMEasting!'
    }
    if (UTMNorthing === undefined) {
      throw 'Please pass the UTMNorthing!'
    }
    if (UTMZoneNumber === undefined) {
      throw 'Please pass the UTMZoneNumber!'
    }
    if (UTMZoneLetter === undefined) {
      throw 'Please pass the UTMZoneLetter!'
    }
    // if ('N' === ZoneLetter) {
    if (ZoneLetter >= 'N');
    else {
      y -= 10000000.0
    }
    var LongOrigin = (ZoneNumber - 1) * 6 - 180 + 3
    var eccPrimeSquared = eccSquared / (1 - eccSquared)
    var M = y / 0.9996
    var mu =
      M /
      (a *
        (1 -
          eccSquared / 4 -
          (3 * eccSquared * eccSquared) / 64 -
          (5 * eccSquared * eccSquared * eccSquared) / 256))
    var phi1Rad =
      mu +
      ((3 * e1) / 2 - (27 * e1 * e1 * e1) / 32) * Math.sin(2 * mu) +
      ((21 * e1 * e1) / 16 - (55 * e1 * e1 * e1 * e1) / 32) * Math.sin(4 * mu) +
      ((151 * e1 * e1 * e1) / 96) * Math.sin(6 * mu)
    var phi1 = MathUtils.radToDeg(phi1Rad)
    var N1 =
      a / Math.sqrt(1 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad))
    var T1 = Math.tan(phi1Rad) * Math.tan(phi1Rad)
    var C1 = eccPrimeSquared * Math.cos(phi1Rad) * Math.cos(phi1Rad)
    var R1 =
      (a * (1 - eccSquared)) /
      Math.pow(1 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad), 1.5)
    var D = x / (N1 * 0.9996)
    var Lat =
      phi1Rad -
      ((N1 * Math.tan(phi1Rad)) / R1) *
        ((D * D) / 2 -
          ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * eccPrimeSquared) *
            D *
            D *
            D *
            D) /
            24 +
          ((61 +
            90 * T1 +
            298 * C1 +
            45 * T1 * T1 -
            252 * eccPrimeSquared -
            3 * C1 * C1) *
            D *
            D *
            D *
            D *
            D *
            D) /
            720)
    Lat = MathUtils.radToDeg(Lat)
    var Long =
      (D -
        ((1 + 2 * T1 + C1) * D * D * D) / 6 +
        ((5 -
          2 * C1 +
          28 * T1 -
          3 * C1 * C1 +
          8 * eccPrimeSquared +
          24 * T1 * T1) *
          D *
          D *
          D *
          D *
          D) /
          120) /
      Math.cos(phi1Rad)
    Long = LongOrigin + MathUtils.radToDeg(Long)
    return { latitude: Lat, longitude: Long }
  }
  GeoUtils._getUtmLetterDesignator = function (latitude) {
    if (84 >= latitude && latitude >= 72) return 'X'
    else if (72 > latitude && latitude >= 64) return 'W'
    else if (64 > latitude && latitude >= 56) return 'V'
    else if (56 > latitude && latitude >= 48) return 'U'
    else if (48 > latitude && latitude >= 40) return 'T'
    else if (40 > latitude && latitude >= 32) return 'S'
    else if (32 > latitude && latitude >= 24) return 'R'
    else if (24 > latitude && latitude >= 16) return 'Q'
    else if (16 > latitude && latitude >= 8) return 'P'
    else if (8 > latitude && latitude >= 0) return 'N'
    else if (0 > latitude && latitude >= -8) return 'M'
    else if (-8 > latitude && latitude >= -16) return 'L'
    else if (-16 > latitude && latitude >= -24) return 'K'
    else if (-24 > latitude && latitude >= -32) return 'J'
    else if (-32 > latitude && latitude >= -40) return 'H'
    else if (-40 > latitude && latitude >= -48) return 'G'
    else if (-48 > latitude && latitude >= -56) return 'F'
    else if (-56 > latitude && latitude >= -64) return 'E'
    else if (-64 > latitude && latitude >= -72) return 'D'
    else if (-72 > latitude && latitude >= -80) return 'C'
    else return 'Z'
  }
  GeoUtils._getEllipsoid = function (name) {
    var a = 0
    var eccSquared = 0
    switch (name) {
      case 'Airy':
        a = 6377563
        eccSquared = 0.00667054
        break
      case 'Australian National':
        a = 6378160
        eccSquared = 0.006694542
        break
      case 'Bessel 1841':
        a = 6377397
        eccSquared = 0.006674372
        break
      case 'Bessel 1841 Nambia':
        a = 6377484
        eccSquared = 0.006674372
        break
      case 'Clarke 1866':
        a = 6378206
        eccSquared = 0.006768658
        break
      case 'Clarke 1880':
        a = 6378249
        eccSquared = 0.006803511
        break
      case 'Everest':
        a = 6377276
        eccSquared = 0.006637847
        break
      case 'Fischer 1960 Mercury':
        a = 6378166
        eccSquared = 0.006693422
        break
      case 'Fischer 1968':
        a = 6378150
        eccSquared = 0.006693422
        break
      case 'GRS 1967':
        a = 6378160
        eccSquared = 0.006694605
        break
      case 'GRS 1980':
        a = 6378137
        eccSquared = 0.00669438
        break
      case 'Helmert 1906':
        a = 6378200
        eccSquared = 0.006693422
        break
      case 'Hough':
        a = 6378270
        eccSquared = 0.00672267
        break
      case 'International':
        a = 6378388
        eccSquared = 0.00672267
        break
      case 'Krassovsky':
        a = 6378245
        eccSquared = 0.006693422
        break
      case 'Modified Airy':
        a = 6377340
        eccSquared = 0.00667054
        break
      case 'Modified Everest':
        a = 6377304
        eccSquared = 0.006637847
        break
      case 'Modified Fischer 1960':
        a = 6378155
        eccSquared = 0.006693422
        break
      case 'South American 1969':
        a = 6378160
        eccSquared = 0.006694542
        break
      case 'WGS 60':
        a = 6378165
        eccSquared = 0.006693422
        break
      case 'WGS 66':
        a = 6378145
        eccSquared = 0.006694542
        break
      case 'WGS 72':
        a = 6378135
        eccSquared = 0.006694318
        break
      case 'ED50':
        a = 6378388
        eccSquared = 0.00672267
        break // International Ellipsoid
      case 'WGS 84':
      case 'EUREF89': // Max deviation from WGS 84 is 40 cm/km see http://ocq.dk/euref89 (in danish)
      case 'ETRS89': // Same as EUREF89
        a = 6378137
        eccSquared = 0.00669438
        break
      // this.status = true;
      //   new Error('No ecclipsoid data associated with unknown datum: '.name);
    }
    return { a: a, eccSquared: eccSquared }
  }
  return GeoUtils
})()

var Vector2 = /** @class */ (function () {
  function Vector2() {}
  return Vector2
})()

export const PositioningUtils = /** @class */ (function () {
  function PositioningUtils() {}
  PositioningUtils._init = function (gps) {
    var coords = gps.getCurrentLocation().coords
    PositioningUtils._gpsCenterReference = new GpsPosition()
    PositioningUtils._gpsCenterReference.latitude = coords.latitude
    PositioningUtils._gpsCenterReference.longitude = coords.longitude
    PositioningUtils._gpsCenterReference.altitude = coords.altitude
    PositioningUtils._utmCenterReference = GeoUtils.latLngToUtm(
      coords.latitude,
      coords.longitude,
      null
    )
  }
  PositioningUtils.getGeoLocationFromWorldPosition = function (pos) {
    if (PositioningUtils._gpsCenterReference) {
      var gpsPosition = GeoUtils.utmToLatLng(
        this._utmCenterReference.easting + pos.x,
        this._utmCenterReference.northing + pos.y,
        this._utmCenterReference.zoneNumber,
        this._utmCenterReference.zoneLetter
      )
      return {
        coords: {
          latitude: gpsPosition.latitude,
          longitude: gpsPosition.longitude,
          altitude: pos.z,
          heading: 0,
        },
      }
    }
    return {
      coords: {
        latitude: 0,
        longitude: 0,
        altitude: 0,
        heading: 0,
      },
    }
  }
  PositioningUtils.getWorldPositionFromGeoLocation = function (lat, lng) {
    if (PositioningUtils._gpsCenterReference) {
      var utm = GeoUtils.latLngToUtm(lat, lng, null)
      return new Vector3(
        utm.easting - this._utmCenterReference.easting, // x => +ve East
        utm.northing - this._utmCenterReference.northing
      )
    }
    return new Vector2()
  }
  return PositioningUtils
})()

export const ScanProperties = /** @class */ (function () {
  function ScanProperties() {}
  Object.defineProperty(ScanProperties, 'TargetCount', {
    get: function () {
      var target = Defaults.TARGET_COUNT
      return target
    },
    enumerable: false,
    configurable: true,
  })
  Object.defineProperty(ScanProperties, 'Angle', {
    get: function () {
      var angle = Defaults.ANGLE
      if (window.matchMedia('(orientation: landscape)').matches) {
        angle = 40
      }
      return angle
    },
    enumerable: false,
    configurable: true,
  })
  return ScanProperties
})()

export const OrientationUtils = /** @class */ (function () {
  function OrientationUtils() {}
  OrientationUtils.getEulerFromQuaternion = function (quaternion) {
    return Quaternion.getEuler(quaternion)
  }
  OrientationUtils.getQuaternionFromEuler = function (euler) {
    var eu = new Euler(euler.x, euler.y, euler.z)
    return Quaternion.fromEuler(eu)
  }
  return OrientationUtils
})()

var LocalizationScan = /** @class */ (function () {
  function LocalizationScan() {
    var _this = this
    this._currentTargetIndex = 0
    this.startScan = function (frameCaptureCallback) {
      _this._isCapturing = true
      _this._frameCaptureCallback = frameCaptureCallback
      _this._startYaw = OrientationUtils.getEulerFromQuaternion(
        SturfeeXRSessionManager.getSession().getXRCameraOrientation()
      ).z
      _this._order = 0
      _this._count = ScanProperties.TargetCount
      _this._currentTargetIndex = 0
      _this._captureFrames()
    }
    this.endScan = function () {
      _this._isCapturing = false
    }
    this._captureFrames = function () {
      if (!_this._isCapturing) {
        return
      }
      var currentTargetYaw = _this._currentTargetIndex * ScanProperties.Angle
      var currentYaw = OrientationUtils.getEulerFromQuaternion(
        SturfeeXRSessionManager.getSession().getXRCameraOrientation()
      ).z
      var yawdiff = _this._getYawDiff(currentYaw, _this._startYaw)
      if (yawdiff >= currentTargetYaw) {
        console.log('[+] Multiframe ::   ==> TARGET ANGLE HIT!')
        console.log('yaw diff : ' + yawdiff)
        var data = {
          count: _this._count,
          order: _this._order++,
        }
        _this._frameCaptureCallback(data)
        if (_this._order >= _this._count) {
          SturfeeXRSessionManager.getSession()._notify(
            SturfeeEvent.LocalizationLoading,
            true
          )
        }
        _this._currentTargetIndex++
      }
      window.requestAnimationFrame(_this._captureFrames)
    }
    this._getYawDiff = function (yaw1, yaw2) {
      var yawDiff = yaw1 - yaw2
      var absYawDiff = Math.abs(yawDiff)
      if (absYawDiff > 180) {
        if (yawDiff > 0) {
          yawDiff = -(360 - absYawDiff)
        } else {
          yawDiff = 360 - absYawDiff
        }
      }
      //If our capture range goes above 180
      var captureRange = (ScanProperties.TargetCount - 1) * ScanProperties.Angle
      if (yawDiff > 0 && captureRange > 180) {
        if (yawDiff < 180 && yawDiff >= 360 - captureRange - 5) {
          // - 5 is subtracted for sanity just in case we want cursorPos beyond last gaze target
          yawDiff -= 360
        }
      }
      return -yawDiff // clockwise is -ve
    }
  }
  return LocalizationScan
})()

var encodeOperationMessages = {
  UNSUPPORTED: 0,
  ALIGNMENT: 4,
  RELOC: 5,
}
function _encodePosition(message, bb) {
  // optional double lat = 1;
  var $lat = message.lat
  if ($lat !== undefined) {
    writeVarint32(bb, 9)
    writeDouble(bb, $lat)
  }
  // optional double lon = 2;
  var $lon = message.lon
  if ($lon !== undefined) {
    writeVarint32(bb, 17)
    writeDouble(bb, $lon)
  }
  // optional double height = 3;
  var $height = message.height
  if ($height !== undefined) {
    writeVarint32(bb, 25)
    writeDouble(bb, $height)
  }
}
function _decodePosition(bb) {
  var message = {}
  end_of_message: while (!isAtEnd(bb)) {
    var tag = readVarint32(bb)
    switch (tag >>> 3) {
      case 0:
        break end_of_message
      // optional double lat = 1;
      case 1: {
        message.lat = readDouble(bb)
        break
      }
      // optional double lon = 2;
      case 2: {
        message.lon = readDouble(bb)
        break
      }
      // optional double height = 3;
      case 3: {
        message.height = readDouble(bb)
        break
      }
      default:
        skipUnknownField(bb, tag & 7)
    }
  }
  return message
}
function _encodeQuaternion(message, bb) {
  // optional double x = 2;
  var $x = message.x
  if ($x !== undefined) {
    writeVarint32(bb, 17)
    writeDouble(bb, $x)
  }
  // optional double y = 1;
  var $y = message.y
  if ($y !== undefined) {
    writeVarint32(bb, 9)
    writeDouble(bb, $y)
  }
  // optional double z = 3;
  var $z = message.z
  if ($z !== undefined) {
    writeVarint32(bb, 25)
    writeDouble(bb, $z)
  }
  // optional double w = 4;
  var $w = message.w
  if ($w !== undefined) {
    writeVarint32(bb, 33)
    writeDouble(bb, $w)
  }
}
function _decodeQuaternion(bb) {
  var message = {}
  end_of_message: while (!isAtEnd(bb)) {
    var tag = readVarint32(bb)
    switch (tag >>> 3) {
      case 0:
        break end_of_message
      // optional double x = 2;
      case 2: {
        message.x = readDouble(bb)
        break
      }
      // optional double y = 1;
      case 1: {
        message.y = readDouble(bb)
        break
      }
      // optional double z = 3;
      case 3: {
        message.z = readDouble(bb)
        break
      }
      // optional double w = 4;
      case 4: {
        message.w = readDouble(bb)
        break
      }
      default:
        skipUnknownField(bb, tag & 7)
    }
  }
  return message
}
function _encodeExternalParameters(message, bb) {
  // optional Position position = 1;
  var $position = message.position
  if ($position !== undefined) {
    writeVarint32(bb, 10)
    var nested = popByteBuffer()
    _encodePosition($position, nested)
    writeVarint32(bb, nested.limit)
    writeByteBuffer(bb, nested)
    pushByteBuffer(nested)
  }
  // optional Quaternion quaternion = 2;
  var $quaternion = message.quaternion
  if ($quaternion !== undefined) {
    writeVarint32(bb, 18)
    var nested = popByteBuffer()
    _encodeQuaternion($quaternion, nested)
    writeVarint32(bb, nested.limit)
    writeByteBuffer(bb, nested)
    pushByteBuffer(nested)
  }
}
function _encodeInternalParameters(message, bb) {
  // optional uint32 scene_height = 1;
  var $scene_height = message.scene_height
  if ($scene_height !== undefined) {
    writeVarint32(bb, 8)
    writeVarint32(bb, $scene_height)
  }
  // optional uint32 scene_width = 2;
  var $scene_width = message.scene_width
  if ($scene_width !== undefined) {
    writeVarint32(bb, 16)
    writeVarint32(bb, $scene_width)
  }
  // optional float fov = 3;
  var $fov = message.fov
  if ($fov !== undefined) {
    writeVarint32(bb, 29)
    writeFloat(bb, $fov)
  }
  // repeated double projectionMatrix = 4;
  var array$projectionMatrix = message.projectionMatrix
  if (array$projectionMatrix !== undefined) {
    var packed = popByteBuffer()
    for (
      var _i = 0, array$projectionMatrix_1 = array$projectionMatrix;
      _i < array$projectionMatrix_1.length;
      _i++
    ) {
      var value = array$projectionMatrix_1[_i]
      writeDouble(packed, value)
    }
    writeVarint32(bb, 34)
    writeVarint32(bb, packed.offset)
    writeByteBuffer(bb, packed)
    pushByteBuffer(packed)
  }
}
function encodeRequest(message) {
  var bb = popByteBuffer()
  _encodeRequest(message, bb)
  return toUint8Array(bb)
}
function _encodeRequest(message, bb) {
  // optional OperationMessages operation = 1;
  var $operation = message.operation
  if ($operation !== undefined) {
    writeVarint32(bb, 8)
    writeVarint32(bb, encodeOperationMessages[$operation])
  }
  // optional uint32 request_id = 2;
  var $request_id = message.request_id
  if ($request_id !== undefined) {
    writeVarint32(bb, 16)
    writeVarint32(bb, $request_id)
  }
  // optional ExternalParameters external_parameters = 3;
  var $external_parameters = message.external_parameters
  if ($external_parameters !== undefined) {
    writeVarint32(bb, 26)
    var nested = popByteBuffer()
    _encodeExternalParameters($external_parameters, nested)
    writeVarint32(bb, nested.limit)
    writeByteBuffer(bb, nested)
    pushByteBuffer(nested)
  }
  // optional InternalParameters internal_parameters = 4;
  var $internal_parameters = message.internal_parameters
  if ($internal_parameters !== undefined) {
    writeVarint32(bb, 34)
    var nested = popByteBuffer()
    _encodeInternalParameters($internal_parameters, nested)
    writeVarint32(bb, nested.limit)
    writeByteBuffer(bb, nested)
    pushByteBuffer(nested)
  }
  // optional uint32 total_num_of_frames = 5;
  var $total_num_of_frames = message.total_num_of_frames
  if ($total_num_of_frames !== undefined) {
    writeVarint32(bb, 40)
    writeVarint32(bb, $total_num_of_frames)
  }
  // optional uint32 frame_order = 6;
  var $frame_order = message.frame_order
  if ($frame_order !== undefined) {
    writeVarint32(bb, 48)
    writeVarint32(bb, $frame_order)
  }
  // optional string tracking_id = 7;
  var $tracking_id = message.tracking_id
  if ($tracking_id !== undefined) {
    writeVarint32(bb, 58)
    writeString(bb, $tracking_id)
  }
  // optional bytes source_image = 9;
  var $source_image = message.source_image
  if ($source_image !== undefined) {
    writeVarint32(bb, 74)
    writeVarint32(bb, $source_image.length), writeBytes(bb, $source_image)
  }
  // optional int64 dev_radius = 20;
  var $dev_radius = message.dev_radius
  if ($dev_radius !== undefined) {
    writeVarint32(bb, 160)
    writeVarint64(bb, $dev_radius)
  }
}
function _decodeResponse(bb) {
  var message = {}
  end_of_message: while (!isAtEnd(bb)) {
    var tag = readVarint32(bb)
    switch (tag >>> 3) {
      case 0:
        break end_of_message
      // optional Position position = 1;
      case 1: {
        var limit = pushTemporaryLength(bb)
        message.position = _decodePosition(bb)
        bb.limit = limit
        break
      }
      // optional Quaternion yaw_offset_quaternion = 2;
      case 2: {
        var limit = pushTemporaryLength(bb)
        message.yaw_offset_quaternion = _decodeQuaternion(bb)
        bb.limit = limit
        break
      }
      // optional Quaternion pitch_offset_quaternion = 3;
      case 3: {
        var limit = pushTemporaryLength(bb)
        message.pitch_offset_quaternion = _decodeQuaternion(bb)
        bb.limit = limit
        break
      }
      default:
        skipUnknownField(bb, tag & 7)
    }
  }
  return message
}
function _decodeError(bb) {
  var message = {}
  end_of_message: while (!isAtEnd(bb)) {
    var tag = readVarint32(bb)
    switch (tag >>> 3) {
      case 0:
        break end_of_message
      // optional ErrorCodes code = 1;
      case 1: {
        var limit = pushTemporaryLength(bb)
        // message.code = _decodeErrorCodes(bb);
        bb.limit = limit
        break
      }
      // optional string message = 2;
      case 2: {
        message.message = readString(bb, readVarint32(bb))
        break
      }
      default:
        skipUnknownField(bb, tag & 7)
    }
  }
  return message
}
function decodeResponseMessage(binary) {
  return _decodeResponseMessage(wrapByteBuffer(binary))
}
function _decodeResponseMessage(bb) {
  var message = {}
  end_of_message: while (!isAtEnd(bb)) {
    var tag = readVarint32(bb)
    switch (tag >>> 3) {
      case 0:
        break end_of_message
      // optional uint32 request_id = 1;
      case 1: {
        message.request_id = readVarint32(bb) >>> 0
        break
      }
      // optional string tracking_id = 2;
      case 2: {
        message.tracking_id = readString(bb, readVarint32(bb))
        break
      }
      // optional Response response = 3;
      case 3: {
        var limit = pushTemporaryLength(bb)
        message.response = _decodeResponse(bb)
        bb.limit = limit
        break
      }
      // optional Error error = 4;
      case 4: {
        var limit = pushTemporaryLength(bb)
        message.error = _decodeError(bb)
        bb.limit = limit
        break
      }
      default:
        skipUnknownField(bb, tag & 7)
    }
  }
  return message
}
function pushTemporaryLength(bb) {
  var length = readVarint32(bb)
  var limit = bb.limit
  bb.limit = bb.offset + length
  return limit
}
function skipUnknownField(bb, type) {
  switch (type) {
    case 0:
      while (readByte(bb) & 0x80) {}
      break
    case 2:
      skip(bb, readVarint32(bb))
      break
    case 5:
      skip(bb, 4)
      break
    case 1:
      skip(bb, 8)
      break
    default:
      throw new Error('Unimplemented type: ' + type)
  }
}
// The code below was modified from https://github.com/protobufjs/bytebuffer.js
// which is under the Apache License 2.0.
var f32 = new Float32Array(1)
var f32_u8 = new Uint8Array(f32.buffer)
var f64 = new Float64Array(1)
var f64_u8 = new Uint8Array(f64.buffer)
var bbStack = []
function popByteBuffer() {
  var bb = bbStack.pop()
  if (!bb) return { bytes: new Uint8Array(64), offset: 0, limit: 0 }
  bb.offset = bb.limit = 0
  return bb
}
function pushByteBuffer(bb) {
  bbStack.push(bb)
}
function wrapByteBuffer(bytes) {
  return { bytes: bytes, offset: 0, limit: bytes.length }
}
function toUint8Array(bb) {
  var bytes = bb.bytes
  var limit = bb.limit
  return bytes.length === limit ? bytes : bytes.subarray(0, limit)
}
function skip(bb, offset) {
  if (bb.offset + offset > bb.limit) {
    throw new Error('Skip past limit')
  }
  bb.offset += offset
}
function isAtEnd(bb) {
  return bb.offset >= bb.limit
}
function grow(bb, count) {
  var bytes = bb.bytes
  var offset = bb.offset
  var limit = bb.limit
  var finalOffset = offset + count
  if (finalOffset > bytes.length) {
    var newBytes = new Uint8Array(finalOffset * 2)
    newBytes.set(bytes)
    bb.bytes = newBytes
  }
  bb.offset = finalOffset
  if (finalOffset > limit) {
    bb.limit = finalOffset
  }
  return offset
}
function advance(bb, count) {
  var offset = bb.offset
  if (offset + count > bb.limit) {
    throw new Error('Read past limit')
  }
  bb.offset += count
  return offset
}
function writeBytes(bb, buffer) {
  var offset = grow(bb, buffer.length)
  bb.bytes.set(buffer, offset)
}
function readString(bb, count) {
  // Sadly a hand-coded UTF8 decoder is much faster than subarray+TextDecoder in V8
  var offset = advance(bb, count)
  var fromCharCode = String.fromCharCode
  var bytes = bb.bytes
  var invalid = '\uFFFD'
  var text = ''
  for (var i = 0; i < count; i++) {
    var c1 = bytes[i + offset],
      c2 = void 0,
      c3 = void 0,
      c4 = void 0,
      c = void 0
    // 1 byte
    if ((c1 & 0x80) === 0) {
      text += fromCharCode(c1)
    }
    // 2 bytes
    else if ((c1 & 0xe0) === 0xc0) {
      if (i + 1 >= count) text += invalid
      else {
        c2 = bytes[i + offset + 1]
        if ((c2 & 0xc0) !== 0x80) text += invalid
        else {
          c = ((c1 & 0x1f) << 6) | (c2 & 0x3f)
          if (c < 0x80) text += invalid
          else {
            text += fromCharCode(c)
            i++
          }
        }
      }
    }
    // 3 bytes
    else if ((c1 & 0xf0) == 0xe0) {
      if (i + 2 >= count) text += invalid
      else {
        c2 = bytes[i + offset + 1]
        c3 = bytes[i + offset + 2]
        if (((c2 | (c3 << 8)) & 0xc0c0) !== 0x8080) text += invalid
        else {
          c = ((c1 & 0x0f) << 12) | ((c2 & 0x3f) << 6) | (c3 & 0x3f)
          if (c < 0x0800 || (c >= 0xd800 && c <= 0xdfff)) text += invalid
          else {
            text += fromCharCode(c)
            i += 2
          }
        }
      }
    }
    // 4 bytes
    else if ((c1 & 0xf8) == 0xf0) {
      if (i + 3 >= count) text += invalid
      else {
        c2 = bytes[i + offset + 1]
        c3 = bytes[i + offset + 2]
        c4 = bytes[i + offset + 3]
        if (((c2 | (c3 << 8) | (c4 << 16)) & 0xc0c0c0) !== 0x808080)
          text += invalid
        else {
          c =
            ((c1 & 0x07) << 0x12) |
            ((c2 & 0x3f) << 0x0c) |
            ((c3 & 0x3f) << 0x06) |
            (c4 & 0x3f)
          if (c < 0x10000 || c > 0x10ffff) text += invalid
          else {
            c -= 0x10000
            text += fromCharCode((c >> 10) + 0xd800, (c & 0x3ff) + 0xdc00)
            i += 3
          }
        }
      }
    } else text += invalid
  }
  return text
}
function writeString(bb, text) {
  // Sadly a hand-coded UTF8 encoder is much faster than TextEncoder+set in V8
  var n = text.length
  var byteCount = 0
  // Write the byte count first
  for (var i = 0; i < n; i++) {
    var c = text.charCodeAt(i)
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < n) {
      c = (c << 10) + text.charCodeAt(++i) - 0x35fdc00
    }
    byteCount += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4
  }
  writeVarint32(bb, byteCount)
  var offset = grow(bb, byteCount)
  var bytes = bb.bytes
  // Then write the bytes
  for (var i = 0; i < n; i++) {
    var c = text.charCodeAt(i)
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < n) {
      c = (c << 10) + text.charCodeAt(++i) - 0x35fdc00
    }
    if (c < 0x80) {
      bytes[offset++] = c
    } else {
      if (c < 0x800) {
        bytes[offset++] = ((c >> 6) & 0x1f) | 0xc0
      } else {
        if (c < 0x10000) {
          bytes[offset++] = ((c >> 12) & 0x0f) | 0xe0
        } else {
          bytes[offset++] = ((c >> 18) & 0x07) | 0xf0
          bytes[offset++] = ((c >> 12) & 0x3f) | 0x80
        }
        bytes[offset++] = ((c >> 6) & 0x3f) | 0x80
      }
      bytes[offset++] = (c & 0x3f) | 0x80
    }
  }
}
function writeByteBuffer(bb, buffer) {
  var offset = grow(bb, buffer.limit)
  var from = bb.bytes
  var to = buffer.bytes
  // This for loop is much faster than subarray+set on V8
  for (var i = 0, n = buffer.limit; i < n; i++) {
    from[i + offset] = to[i]
  }
}
function readByte(bb) {
  return bb.bytes[advance(bb, 1)]
}
function writeByte(bb, value) {
  var offset = grow(bb, 1)
  bb.bytes[offset] = value
}
function writeFloat(bb, value) {
  var offset = grow(bb, 4)
  var bytes = bb.bytes
  f32[0] = value
  // Manual copying is much faster than subarray+set in V8
  bytes[offset++] = f32_u8[0]
  bytes[offset++] = f32_u8[1]
  bytes[offset++] = f32_u8[2]
  bytes[offset++] = f32_u8[3]
}
function readDouble(bb) {
  var offset = advance(bb, 8)
  var bytes = bb.bytes
  // Manual copying is much faster than subarray+set in V8
  f64_u8[0] = bytes[offset++]
  f64_u8[1] = bytes[offset++]
  f64_u8[2] = bytes[offset++]
  f64_u8[3] = bytes[offset++]
  f64_u8[4] = bytes[offset++]
  f64_u8[5] = bytes[offset++]
  f64_u8[6] = bytes[offset++]
  f64_u8[7] = bytes[offset++]
  return f64[0]
}
function writeDouble(bb, value) {
  var offset = grow(bb, 8)
  var bytes = bb.bytes
  f64[0] = value
  // Manual copying is much faster than subarray+set in V8
  bytes[offset++] = f64_u8[0]
  bytes[offset++] = f64_u8[1]
  bytes[offset++] = f64_u8[2]
  bytes[offset++] = f64_u8[3]
  bytes[offset++] = f64_u8[4]
  bytes[offset++] = f64_u8[5]
  bytes[offset++] = f64_u8[6]
  bytes[offset++] = f64_u8[7]
}
function readVarint32(bb) {
  var c = 0
  var value = 0
  var b
  do {
    b = readByte(bb)
    if (c < 32) value |= (b & 0x7f) << c
    c += 7
  } while (b & 0x80)
  return value
}
function writeVarint32(bb, value) {
  value >>>= 0
  while (value >= 0x80) {
    writeByte(bb, (value & 0x7f) | 0x80)
    value >>>= 7
  }
  writeByte(bb, value)
}
function writeVarint64(bb, value) {
  var part0 = value.low >>> 0
  var part1 = ((value.low >>> 28) | (value.high << 4)) >>> 0
  var part2 = value.high >>> 24
  // ref: src/google/protobuf/io/coded_stream.cc
  var size =
    part2 === 0
      ? part1 === 0
        ? part0 < 1 << 14
          ? part0 < 1 << 7
            ? 1
            : 2
          : part0 < 1 << 21
          ? 3
          : 4
        : part1 < 1 << 14
        ? part1 < 1 << 7
          ? 5
          : 6
        : part1 < 1 << 21
        ? 7
        : 8
      : part2 < 1 << 7
      ? 9
      : 10
  var offset = grow(bb, size)
  var bytes = bb.bytes
  switch (size) {
    case 10:
      bytes[offset + 9] = (part2 >>> 7) & 0x01
    case 9:
      bytes[offset + 8] = size !== 9 ? part2 | 0x80 : part2 & 0x7f
    case 8:
      bytes[offset + 7] =
        size !== 8 ? (part1 >>> 21) | 0x80 : (part1 >>> 21) & 0x7f
    case 7:
      bytes[offset + 6] =
        size !== 7 ? (part1 >>> 14) | 0x80 : (part1 >>> 14) & 0x7f
    case 6:
      bytes[offset + 5] =
        size !== 6 ? (part1 >>> 7) | 0x80 : (part1 >>> 7) & 0x7f
    case 5:
      bytes[offset + 4] = size !== 5 ? part1 | 0x80 : part1 & 0x7f
    case 4:
      bytes[offset + 3] =
        size !== 4 ? (part0 >>> 21) | 0x80 : (part0 >>> 21) & 0x7f
    case 3:
      bytes[offset + 2] =
        size !== 3 ? (part0 >>> 14) | 0x80 : (part0 >>> 14) & 0x7f
    case 2:
      bytes[offset + 1] =
        size !== 2 ? (part0 >>> 7) | 0x80 : (part0 >>> 7) & 0x7f
    case 1:
      bytes[offset] = size !== 1 ? part0 | 0x80 : part0 & 0x7f
  }
}

// import { Response, ResponseMessage } from '../localization/Params';
var VpsSocketClient = /** @class */ (function () {
  function VpsSocketClient() {
    var _this = this
    this._timeout = 20 * 1000 // 20 seconds
    this._listenerAdded = false
    this.connect = function (url, token) {
      return new Promise(function (resolve, reject) {
        // if already connected
        if (
          _this._connection &&
          _this._connection.readyState === WebSocket.OPEN
        ) {
          resolve(true)
          return
        }
        setTimeout(function () {
          if (_this._connection.readyState !== WebSocket.OPEN) {
            console.log('Socket: ERROR - Connection Failed (timeout)')
            reject('Socket: ERROR - Connection Failed (timeout)')
          }
        }, _this._timeout)
        // document.cookie = 'Authorization=Bearer ' + this._token + '; path=/';
        // const uri = `${url}?token=${token}`;
        var uri = '' + url
        _this._connection = new WebSocket(uri)
        // this._connection.binaryType = 'blob';
        _this._connection.binaryType = 'arraybuffer'
        _this._connection.onopen = function (event) {
          console.log('Socket: CONNECTED')
          resolve(true)
        }
        _this._connection.onclose = function (event) {
          console.log('Socket: DISCONNECTED')
        }
        _this._connection.onerror = function (error) {
          console.log(
            'Socket: ERROR (' +
              JSON.stringify(error, ['message', 'arguments', 'type', 'name']) +
              ')'
          )
          console.log('Socket: ERROR (ERROR Object = ' + error + ')')
          console.error(error)
        }
        _this._connection.onmessage = function (event) {
          console.log('Socket: received data: \n ' + event.data)
        }
      })
    }
    this.disconnect = function () {
      _this._connection.close()
    }
    this.getStatus = function () {
      return _this._connection.readyState
    }
    this.getCameraOffset = function (url, token, requestId, requestBlob) {
      return new Promise(function (resolve, reject) {
        _this
          .connect(url, token)
          .then(function () {
            console.log('Sending request to vps service...')
            // If listener not added
            if (!_this._listenerAdded) {
              var that_1 = _this
              _this._connection.addEventListener(
                'message',
                function handleMessage(event) {
                  // let response= ResponseMessage.decode(event.data);
                  var response = decodeResponseMessage(
                    new Uint8Array(event.data)
                  )
                  // console.log(` Response : ${JSON.stringify(ResponseMessage.toJSON(response))}`) ;
                  console.log(' Response Id:' + response.request_id)
                  console.log(' Response : ' + JSON.stringify(response))
                  resolve(response)
                  that_1._connection.removeEventListener(
                    'message',
                    handleMessage
                  )
                  that_1._listenerAdded = false
                }
              )
              _this._listenerAdded = true
            }
            // send request
            _this._connection.send(requestBlob)
          })
          .catch(function (error) {
            reject(error)
          })
      })
    }
  }
  return VpsSocketClient
})()

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function (d, b) {
  extendStatics =
    Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array &&
      function (d, b) {
        d.__proto__ = b
      }) ||
    function (d, b) {
      for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]
    }
  return extendStatics(d, b)
}

function __extends(d, b) {
  extendStatics(d, b)
  function __() {
    this.constructor = d
  }
  d.prototype =
    b === null ? Object.create(b) : ((__.prototype = b.prototype), new __())
}

var MessageType
;(function (MessageType) {
  MessageType[(MessageType['Align'] = 1)] = 'Align'
  MessageType[(MessageType['Refine'] = 2)] = 'Refine'
  MessageType[(MessageType['HitScan'] = 3)] = 'HitScan'
  MessageType[(MessageType['StaticMultiframe'] = 4)] = 'StaticMultiframe'
  MessageType[(MessageType['Relocalize'] = 5)] = 'Relocalize'
  MessageType[(MessageType['DynamicMultiframe'] = 6)] = 'DynamicMultiframe'
})(MessageType || (MessageType = {}))
var LocalizationResponse = /** @class */ (function () {
  function LocalizationResponse() {}
  return LocalizationResponse
})()
var LocalizationErrorResponse = /** @class */ (function (_super) {
  __extends(LocalizationErrorResponse, _super)
  function LocalizationErrorResponse() {
    return (_super !== null && _super.apply(this, arguments)) || this
  }
  return LocalizationErrorResponse
})(LocalizationResponse)

var DeviceDetector = /** @class */ (function () {
  function DeviceDetector() {}
  DeviceDetector.getDeviceInfo = function () {
    this._header = [
      navigator.platform,
      navigator.userAgent,
      navigator.appVersion,
      navigator.vendor,
    ] // , window.opera];
    var agent = this._header.join(' '),
      os = this._matchItem(agent, this.osData),
      browser = this._matchItem(agent, this.browserData)
    // return { os: os, browser: browser };
    return {
      osName: os.name,
      osVersion: os.version,
      browserName: browser.name,
      browserVersion: browser.version,
      // userAgent: ,
      // appVersion: ,
      platform: navigator.platform,
    }
  }
  DeviceDetector._matchItem = function (string, data) {
    var i = 0,
      j = 0,
      regex,
      regexv,
      match,
      matches,
      version
    for (i = 0; i < data.length; i += 1) {
      regex = new RegExp(data[i].value, 'i')
      match = regex.test(string)
      if (match) {
        regexv = new RegExp(data[i].version + '[- /:;]([\\d._]+)', 'i')
        matches = string.match(regexv)
        version = ''
        if (matches) {
          if (matches[1]) {
            matches = matches[1]
          }
        }
        if (matches) {
          matches = matches.split(/[._]+/)
          for (j = 0; j < matches.length; j += 1) {
            if (j === 0) {
              version += matches[j] + '.'
            } else {
              version += matches[j]
            }
          }
        } else {
          version = '0'
        }
        return {
          name: data[i].name,
          version: parseFloat(version),
        }
      }
    }
    return { name: 'unknown', version: 0 }
  }
  DeviceDetector.osData = [
    { name: 'Windows Phone', value: 'Windows Phone', version: 'OS' },
    { name: 'Windows', value: 'Win', version: 'NT' },
    { name: 'iPhone', value: 'iPhone', version: 'OS' },
    { name: 'iPad', value: 'iPad', version: 'OS' },
    { name: 'Kindle', value: 'Silk', version: 'Silk' },
    { name: 'Android', value: 'Android', version: 'Android' },
    { name: 'PlayBook', value: 'PlayBook', version: 'OS' },
    { name: 'BlackBerry', value: 'BlackBerry', version: '/' },
    { name: 'Macintosh', value: 'Mac', version: 'OS X' },
    { name: 'Linux', value: 'Linux', version: 'rv' },
    { name: 'Palm', value: 'Palm', version: 'PalmOS' },
  ]
  DeviceDetector.browserData = [
    { name: 'Chrome', value: 'Chrome', version: 'Chrome' },
    { name: 'Firefox', value: 'Firefox', version: 'Firefox' },
    { name: 'Safari', value: 'Safari', version: 'Version' },
    { name: 'Internet Explorer', value: 'MSIE', version: 'MSIE' },
    { name: 'Opera', value: 'Opera', version: 'Opera' },
    { name: 'BlackBerry', value: 'CLDC', version: 'CLDC' },
    { name: 'Mozilla', value: 'Mozilla', version: 'Mozilla' },
  ]
  return DeviceDetector
})()

var Utils = /** @class */ (function () {
  function Utils() {}
  // 1 byte per char (UTF-8)
  Utils.strToArrayBuffer = function (str) {
    return new Uint8Array(
      str.split('').map(function (c) {
        return c.charCodeAt(0)
      })
    ).buffer
  }
  Utils.ArrayBufferToStr = function (ab) {
    return new Uint8Array(ab).reduce(function (p, c) {
      return p + String.fromCharCode(c)
    }, '')
  }
  Utils.numberToBytes = function (num) {
    var arr = new ArrayBuffer(4) // an Int32 takes 4 bytes
    var view = new DataView(arr)
    view.setUint32(0, num, true) //, false); // byteOffset = 0; litteEndian = false
    return arr // return new Uint32Array(arr);
  }
  Utils.bytesToNumber = function (arrayBuf) {
    var view = new DataView(arrayBuf)
    return view.getUint32(0)
  }
  // 2 bytes per char (UTF-16)
  Utils.ab2str = function (buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf))
  }
  Utils.str2ab = function (str) {
    var buf = new ArrayBuffer(str.length * 2) // 2 bytes for each char
    var bufView = new Uint16Array(buf)
    for (var i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i)
    }
    return buf
  }
  Utils.intFromBytes = function (x) {
    var val = 0
    for (var i = 0; i < x.length; ++i) {
      val += x[i]
      if (i < x.length - 1) {
        val = val << 8
      }
    }
    return val
  }
  Utils.getInt64Bytes = function (x) {
    var bytes = []
    var i = 8
    do {
      bytes[--i] = x & 255
      x = x >> 8
    } while (i)
    return bytes
  }
  return Utils
})()

var LocalizationManager = /** @class */ (function () {
  function LocalizationManager(serverApi, accessToken) {
    var _this = this
    this._requestId = 0
    // Relocalization
    this._trackingId = null
    // Response
    this._yawOffset = new Quaternion(0, 0, 0, 1)
    this._pitchOffset = new Quaternion(0, 0, 0, 1)
    this._trackingOrigin = new Vector3(0, 0, 0)
    this.performLocalization = function () {
      //TODO: Check Request Errors ( for later)
      _this._requestId++
      if (!_this._isLocalized) {
        _this._localizationScan.startScan(_this._onFrameCaptured)
      } else {
        _this._perforReLocalization()
      }
    }
    this.getYawOffsetCorrection = function () {
      return _this._yawOffset
    }
    this.getPitchOffsetCorrection = function () {
      return _this._pitchOffset
    }
    this.getLocationCorrection = function () {
      return _this._locationCorrection
    }
    this.getLocationOffset = function () {
      var position = new Vector3()
      var coords
      var absolute
      var relative
      if (!_this._isLocalized) {
        coords =
          SturfeeXRSessionManager.getSession().gps.getCurrentLocation().coords
        relative = SturfeeXRSessionManager.getSession().imu.getPosition()
      } else {
        coords = _this.getLocationCorrection().coords
        relative = _this._trackingOrigin
      }
      absolute = PositioningUtils.getWorldPositionFromGeoLocation(
        coords.latitude,
        coords.longitude
      )
      // Follow World Coordinate System
      absolute.z = coords.altitude
      position.x = absolute.x - relative.x // +ve East
      position.y = absolute.y - relative.y // +ve North
      position.z = absolute.z - relative.z // altitude
      return position
    }
    this._onFrameCaptured = function (frame) {
      SturfeeXRSessionManager.getSession()._notify(
        SturfeeEvent.FrameCaptured,
        true
      )
      var requestId = _this._requestId * 10 + MessageType.StaticMultiframe
      var request = _this._createOffsetRequest()
      request.frame = frame
      SturfeeXRSessionManager.getSession()
        .video.getCurrentImage()
        .then(function (image) {
          // let requestBlob = this._buildRequestBlob(requestId, image, request, MessageType.StaticMultiframe);
          var protoReq = encodeRequest(
            _this._getProtoRequest(requestId, image, request)
          )
          var blob = new Blob([protoReq])
          _this._vpsSocketClient
            .getCameraOffset(
              _this._serverApi,
              _this._accessToken,
              requestId,
              blob
            )
            .then(function (response) {
              // Vps client will respond only after all the frames are recieved
              if (response.request_id == requestId) {
                _this._handleLocalizationResponse(response)
              } else {
                console.error(' Response Id does not match with request Id')
              }
            })
            .catch(function (error) {
              console.error(
                'ERROR: vps failed (' +
                  error +
                  ' => ' +
                  JSON.stringify(error) +
                  ')'
              )
              SturfeeXRSessionManager.getSession()._notify(
                SturfeeEvent.LocalizationFail,
                error
              )
            })
        })
        .catch(function (error) {
          return console.error(
            'ERROR: Could not take picture (' +
              error +
              ' => ' +
              JSON.stringify(error) +
              ')'
          )
        })
    }
    this._getProtoRequest = function (requestId, image, request) {
      var protoRequest = {
        operation: 'ALIGNMENT' /* ALIGNMENT */,
        request_id: requestId,
        external_parameters: {
          position: {
            lat: request.externalParameters.latitude,
            lon: request.externalParameters.longitude,
            height: request.externalParameters.height,
          },
          quaternion: {
            x: request.externalParameters.quaternion.x,
            y: request.externalParameters.quaternion.y,
            z: request.externalParameters.quaternion.z,
            w: request.externalParameters.quaternion.w,
          },
        },
        internal_parameters: {
          scene_height: request.internalParameters.sceneHeight,
          scene_width: request.internalParameters.sceneWidth,
          fov: request.internalParameters.fov,
          projectionMatrix: [
            request.internalParameters.projectionMatrix.e00,
            request.internalParameters.projectionMatrix.e01,
            request.internalParameters.projectionMatrix.e02,
            request.internalParameters.projectionMatrix.e03,
            request.internalParameters.projectionMatrix.e10,
            request.internalParameters.projectionMatrix.e11,
            request.internalParameters.projectionMatrix.e12,
            request.internalParameters.projectionMatrix.e13,
            request.internalParameters.projectionMatrix.e20,
            request.internalParameters.projectionMatrix.e21,
            request.internalParameters.projectionMatrix.e22,
            request.internalParameters.projectionMatrix.e23,
            request.internalParameters.projectionMatrix.e30,
            request.internalParameters.projectionMatrix.e31,
            request.internalParameters.projectionMatrix.e32,
            request.internalParameters.projectionMatrix.e33,
          ],
        },
        total_num_of_frames: request.frame.count,
        frame_order: request.frame.order,
        tracking_id: '',
        dev_radius: new Long(30),
      }
      console.log(JSON.stringify(protoRequest))
      protoRequest.source_image = new Uint8Array(image)
      return protoRequest
    }
    this._createOffsetRequest = function () {
      var request = {
        internalParameters: {
          sceneWidth: SturfeeXRSessionManager.getSession().video.getWidth(),
          sceneHeight: SturfeeXRSessionManager.getSession().video.getHeight(),
          fov: SturfeeXRSessionManager.getSession().video.getFOV(),
          isPortrait: SturfeeXRSessionManager.getSession().video.isPortrait
            ? 1
            : 0,
          projectionMatrix:
            SturfeeXRSessionManager.getSession().video.getProjectionMatrix(),
        },
        externalParameters: {
          latitude:
            SturfeeXRSessionManager.getSession().gps.getCurrentLocation().coords
              .latitude,
          longitude:
            SturfeeXRSessionManager.getSession().gps.getCurrentLocation().coords
              .longitude,
          height:
            SturfeeXRSessionManager.getSession().gps.getCurrentLocation().coords
              .altitude,
          quaternion: Quaternion.fromQuaternion(
            SturfeeXRSessionManager.getSession().imu.getOrientation()
          ),
        },
        deviceParameters: {
          deviceModel: 'Unknown',
          deviceType:
            DeviceDetector.getDeviceInfo().browserName +
            ' (v' +
            DeviceDetector.getDeviceInfo().browserVersion +
            ')',
          operatingSystem:
            DeviceDetector.getDeviceInfo().osName +
            ' (v' +
            DeviceDetector.getDeviceInfo().osVersion +
            ')',
          processorType: '' + DeviceDetector.getDeviceInfo().platform,
        },
        frame: {
          count: 0,
          order: 0,
        },
        radius: 30,
        id: '',
        relocalization: {
          yawRange: 0,
          pitchRange: 0,
          radius: 0,
        },
      }
      return request
    }
    this._perforReLocalization = function () {}
    this._serverApi = serverApi
    this._accessToken = accessToken
    this._localizationScan = new LocalizationScan()
  }
  LocalizationManager.prototype._init = function () {
    var _this = this
    return new Promise(function (resolve, reject) {
      _this._vpsSocketClient = new VpsSocketClient()
      var lat =
        SturfeeXRSessionManager.getSession().gps.getCurrentLocation().coords
          .latitude
      var lng =
        SturfeeXRSessionManager.getSession().gps.getCurrentLocation().coords
          .longitude
      var url =
        _this._serverApi +
        '?latitude=' +
        lat +
        '&longitude=' +
        lng +
        '&token=' +
        _this._accessToken
      _this._vpsSocketClient
        .connect(url, _this._accessToken)
        .then(function () {
          resolve()
        })
        .catch(function (err) {
          reject(err)
        })
    })
  }
  Object.defineProperty(LocalizationManager.prototype, 'isLocalized', {
    /**
     * Getter islocalized
     * @return {boolean}
     */
    get: function () {
      return this._isLocalized
    },
    enumerable: false,
    configurable: true,
  })
  LocalizationManager.prototype._handleLocalizationResponse = function (
    localizationResponse
  ) {
    if (localizationResponse.error) {
      throw new Error(localizationResponse.error.message)
    }
    this._isLocalized = true
    this._trackingId = localizationResponse.tracking_id
    this._trackingOrigin =
      SturfeeXRSessionManager.getSession().imu.getPosition()
    var tracingId = document.getElementById('tracing-id')
    if (tracingId) tracingId.innerHTML = this._trackingId
    var response = localizationResponse.response
    // Orientations
    var yaw = new Quaternion(
      response.yaw_offset_quaternion.x,
      response.yaw_offset_quaternion.y,
      response.yaw_offset_quaternion.z,
      response.yaw_offset_quaternion.w
    )
    var pitch = new Quaternion(
      response.pitch_offset_quaternion.x,
      response.pitch_offset_quaternion.y,
      response.pitch_offset_quaternion.z,
      response.pitch_offset_quaternion.w
    )
    this._yawOffset = Quaternion.multiplyQuaternions(yaw, this._yawOffset)
    this._pitchOffset = Quaternion.multiplyQuaternions(this._pitchOffset, pitch)
    // Location
    this._locationCorrection = {
      coords: {
        latitude: response.position.lat,
        longitude: response.position.lon,
        altitude: response.position.height,
        heading: 0,
      },
    }
    // Wait for 1 frame ?
    window.requestAnimationFrame(function () {
      return SturfeeXRSessionManager.getSession()._notify(
        SturfeeEvent.LocalizationComplete,
        response
      )
    })
    this._localizationScan.endScan()
  }
  LocalizationManager.prototype._buildRequestBlob = function (
    requestId,
    image,
    request,
    messageType
  ) {
    var opBuffer = Utils.numberToBytes(messageType) // new Uint8Array[4]; // Operation: 4 bytes (int32)
    var opView = new DataView(opBuffer)
    var idBuffer = Utils.numberToBytes(requestId) // Request Id: 4 bytes
    var idView = new DataView(idBuffer)
    var imageBuffer = new Uint8Array(image)
    var lengthBuffer = Utils.numberToBytes(imageBuffer.byteLength) // Length: 4 bytes
    var lengthView = new DataView(lengthBuffer)
    var reqBuffer = Utils.strToArrayBuffer(JSON.stringify(request)) // request data
    var blobData = new Blob([
      opView,
      idView,
      lengthView,
      imageBuffer,
      reqBuffer,
    ])
    return blobData
  }
  return LocalizationManager
})()

var SessionPoseController = /** @class */ (function () {
  function SessionPoseController() {
    this._childWorldPos = new THREE.Vector3()
    this._origin = new THREE.Vector3()
    var that = this
    this.Session.on(SturfeeEvent.LocalizationComplete, function () {
      that._origin = new THREE.Vector3(
        that.Session.imu.getPosition().x,
        that.Session.imu.getPosition().y,
        that.Session.imu.getPosition().z
      )
    })
  }
  Object.defineProperty(SessionPoseController.prototype, 'Session', {
    get: function () {
      if (!this._session) {
        this._session = SturfeeXRSessionManager.getSession()
      }
      return this._session
    },
    enumerable: false,
    configurable: true,
  })
  Object.defineProperty(SessionPoseController.prototype, 'Parent', {
    get: function () {
      if (!this._parent) {
        this._parent = new THREE.Mesh()
      }
      return this._parent
    },
    enumerable: false,
    configurable: true,
  })
  Object.defineProperty(SessionPoseController.prototype, 'Child', {
    get: function () {
      if (!this._child) {
        this._child = new THREE.Mesh()
        this._child.parent = this.Parent
      }
      return this._child
    },
    enumerable: false,
    configurable: true,
  })
  SessionPoseController.prototype.getPosition = function (absoluteLocation) {
    // Get offset quaternion
    var offset = new THREE.Quaternion(
      this.Session.getOrientationOffset().x,
      this.Session.getOrientationOffset().y,
      this.Session.getOrientationOffset().z,
      this.Session.getOrientationOffset().w
    )
    // set parent to offset
    this.Parent.setRotationFromQuaternion(offset)
    // set child's local position
    this.Child.position.set(
      this.Session.imu.getPosition().x - this._origin.x,
      this.Session.imu.getPosition().y - this._origin.y,
      this.Session.imu.getPosition().z - this._origin.z
    )
    this.Parent.updateMatrixWorld()
    this.Child.getWorldPosition(this._childWorldPos)
    var worldPos = PositioningUtils.getWorldPositionFromGeoLocation(
      absoluteLocation.coords.latitude,
      absoluteLocation.coords.longitude
    )
    var finalWorldPos = new Vector3(
      worldPos.x + this._childWorldPos.x,
      worldPos.y + this._childWorldPos.y,
      absoluteLocation.coords.altitude + this._childWorldPos.z
    )
    var finalLocation =
      PositioningUtils.getGeoLocationFromWorldPosition(finalWorldPos)
    return finalLocation
  }
  return SessionPoseController
})()

var SturfeeEvent
;(function (SturfeeEvent) {
  SturfeeEvent['Initializing'] = 'initializing'
  SturfeeEvent['Error'] = 'error'
  SturfeeEvent['MeshDataLoaded'] = 'meshDataLoaded'
  SturfeeEvent['Ready'] = 'ready'
  SturfeeEvent['FrameCaptured'] = 'frameCaptured'
  SturfeeEvent['LocalizationLoading'] = 'localizationLoading'
  SturfeeEvent['LocalizationComplete'] = 'localizationComplete'
  SturfeeEvent['LocalizationFail'] = 'localizationFail'
})(SturfeeEvent || (SturfeeEvent = {}))
export const SturfeeXRSessionManager = /** @class */ (function () {
  function SturfeeXRSessionManager(sturfeeXRConfig) {
    // Events
    this._eventHandlers = []
    sturfeeXRConfig = sturfeeXRConfig || new SturfeeXRConfig()
    // assigned or use defaults
    this._video = sturfeeXRConfig.videoProvider || new DeviceVideo()
    this._imu = sturfeeXRConfig.imuProvider || new DeviceImu()
    this._gps = sturfeeXRConfig.gpsProvider || new DeviceGPS()
    this._sturfeeXRConfig = sturfeeXRConfig
    this._init()
  }
  SturfeeXRSessionManager.getSession = function () {
    return this._session
  }
  SturfeeXRSessionManager.createSession = function (sturfeeXrConfig) {
    this._session = new SturfeeXRSessionManager(sturfeeXrConfig)
    return this._session
  }
  SturfeeXRSessionManager.startSession = function (sturfeeXrConfig) {
    return this.createSession(sturfeeXrConfig)
  }
  SturfeeXRSessionManager.endSession = function () {
    SturfeeXRSessionManager._session = null
  }
  SturfeeXRSessionManager.prototype.performLocalization = function () {
    this._localizationManager.performLocalization()
  }
  SturfeeXRSessionManager.prototype.getXRCameraLocation = function () {
    var location
    if (!this._localizationManager.isLocalized) {
      location = this._gps.getCurrentLocation()
    } else {
      location = this._localizationManager.getLocationCorrection()
      location = this._sessionPoseController.getPosition(
        this._localizationManager.getLocationCorrection()
      )
    }
    return {
      coords: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        heading: 0,
      },
    }
  }
  SturfeeXRSessionManager.prototype.getXRCameraOrientation = function () {
    var sensor = Quaternion.fromQuaternion(this._imu.getOrientation())
    if (!this._localizationManager.isLocalized) {
      return sensor
    }
    var yaw = Quaternion.fromQuaternion(
      this._localizationManager.getYawOffsetCorrection()
    )
    var pitch = Quaternion.fromQuaternion(
      this._localizationManager.getPitchOffsetCorrection()
    )
    return yaw.multiply(sensor).multiply(pitch)
  }
  SturfeeXRSessionManager.prototype.getLocationOffset = function () {
    return this._localizationManager.getLocationOffset()
  }
  SturfeeXRSessionManager.prototype.getOrientationOffset = function () {
    var yaw = Quaternion.fromQuaternion(
      this._localizationManager.getYawOffsetCorrection()
    )
    var sensor = Quaternion.fromQuaternion(this._imu.getOrientation())
    var pitch = Quaternion.fromQuaternion(
      this._localizationManager.getPitchOffsetCorrection()
    )
    return yaw
      .multiply(sensor)
      .multiply(pitch)
      .multiply(Quaternion.inverse(sensor))
  }
  SturfeeXRSessionManager.prototype.on = function (eventType, handler) {
    this._eventHandlers.push({ type: eventType, handler: handler })
  }
  SturfeeXRSessionManager.prototype.off = function (eventType, handler) {
    this._eventHandlers = this._eventHandlers.filter(function (eventHandler) {
      return eventHandler.handler !== handler && eventHandler.type !== eventType
    })
  }
  SturfeeXRSessionManager.prototype._notify = function (eventType, data) {
    for (var _i = 0, _a = this._eventHandlers; _i < _a.length; _i++) {
      var handler = _a[_i]
      if (handler.type === eventType) {
        handler.handler(data)
      }
    }
  }
  Object.defineProperty(SturfeeXRSessionManager.prototype, 'video', {
    /**
     * Getter video
     * @return {VideoProvider}
     */
    get: function () {
      return this._video
    },
    enumerable: false,
    configurable: true,
  })
  Object.defineProperty(SturfeeXRSessionManager.prototype, 'imu', {
    /**
     * Getter imu
     * @return {ImuProvider}
     */
    get: function () {
      return this._imu
    },
    enumerable: false,
    configurable: true,
  })
  Object.defineProperty(SturfeeXRSessionManager.prototype, 'gps', {
    /**
     * Getter gps
     * @return {GpsProvider}
     */
    get: function () {
      return this._gps
    },
    enumerable: false,
    configurable: true,
  })
  SturfeeXRSessionManager.prototype._init = function () {
    var _this = this
    // Wait 1 frame before initializing
    window.requestAnimationFrame(function () {
      _this._sessionPoseController = new SessionPoseController()
      if (!_this._sturfeeXRConfig.accessKey) {
        _this._notify(SturfeeEvent.Error, 'Access key not provided')
        return
      }
      _this._notify(SturfeeEvent.Initializing, 'Initializing...')
      // First validate token
      _this
        ._validateToken()
        // then start sensors
        .then(function () {
          return _this._startSensors()
        })
        // then check coverage
        .then(function () {
          return _this._checkCoverage()
        })
        // then load mesh
        .then(function () {
          return _this._loadMesh()
        })
        // then start localization client
        .then(function () {
          return _this._startLocalizationManager()
        })
        // session is ready
        .then(function () {
          // Everything is ready
          _this._notify(SturfeeEvent.Ready, 'READY!')
          _this._ready = true
        })
        .catch(function (err) {
          console.error('ERROR :: Failed to Initialize XR (' + err + ')')
          _this._notify(
            SturfeeEvent.Error,
            'ERROR :: Failed to Initialize XR (' + err + ')'
          )
        })
      // Session TimeOut
      setTimeout(function () {
        if (!_this._ready) {
          _this._notify(SturfeeEvent.Error, 'TIMEOUT')
        }
      }, 30 * 1000) // 30 seconds
    })
  }
  SturfeeXRSessionManager.prototype._validateToken = function () {
    var _this = this
    return new Promise(function (resolve, reject) {
      var url =
        'https://' +
        Defaults._STURFEE_API_URL +
        '/status?token=' +
        _this._sturfeeXRConfig.accessKey
      var header = {
        Authorization: 'Bearer ' + _this._sturfeeXRConfig.accessKey,
      }
      fetch(url, {
        headers: header,
      })
        .then(function (response) {
          if (!response.ok) {
            reject('Invalid token')
          } else {
            resolve()
          }
        })
        .catch(function (err) {
          reject(err)
        })
    })
  }
  SturfeeXRSessionManager.prototype._checkCoverage = function () {
    var _this = this
    return new Promise(function (resolve, reject) {
      var url =
        'https://' +
        Defaults._STURFEE_API_URL +
        '/alignment_available/?lat=' +
        _this.gps.getCurrentLocation().coords.latitude +
        '&lng=' +
        _this.gps.getCurrentLocation().coords.longitude +
        '&token=' +
        _this._sturfeeXRConfig.accessKey
      var header = {
        Authorization: 'Bearer ' + _this._sturfeeXRConfig.accessKey,
      }
      fetch(url, {
        headers: header,
      })
        .then(function (response) {
          if (!response.ok) {
            reject('VPS not available at this location')
          } else {
            resolve()
          }
        })
        .catch(function (err) {
          reject(err)
        })
    })
  }
  SturfeeXRSessionManager.prototype._startSensors = function () {
    var _this = this
    return new Promise(function (resolve, reject) {
      var imuReady = _this._imu.init()
      var gpsReady = _this._gps.init()
      var videoReady = _this._video.init()
      Promise.all([imuReady, gpsReady, videoReady])
        .then(function (values) {
          resolve()
        })
        .catch(function (error) {
          reject(error)
        })
    })
  }
  SturfeeXRSessionManager.prototype._loadMesh = function () {
    var _this = this
    return new Promise(function (resolve, reject) {
      var meshType = _this._sturfeeXRConfig.meshType || MeshType.GLTF
      // set the mesh data type used for SturG Tiles
      switch (meshType) {
        case MeshType.GLTF:
          _this._meshDataClient = new GltfMeshClient(
            Defaults._STURFEE_API_URL,
            _this._sturfeeXRConfig.accessKey
          )
          break
        case MeshType.OBJ:
          throw '.obj File Format not supported'
        default:
          _this._meshDataClient = new GltfMeshClient(
            Defaults._STURFEE_API_URL,
            _this._sturfeeXRConfig.accessKey
          )
      }
      _this._meshDataClient
        .loadMesh(_this._gps)
        .then(function (data) {
          _this._notify(SturfeeEvent.MeshDataLoaded, data)
          // This will set center reference
          PositioningUtils._init(_this._gps)
          resolve()
        })
        .catch(function (err) {
          console.error('UNABLE TO LOAD BUILDING TILES {' + err + '}')
          _this._notify(SturfeeEvent.Error, 'UNABLE TO LOAD BUILDING TILES')
          reject(err)
        })
    })
  }
  SturfeeXRSessionManager.prototype._startLocalizationManager = function () {
    var _this = this
    return new Promise(function (resolve, reject) {
      _this._localizationManager = new LocalizationManager(
        Defaults._WEBSOCKET_URL,
        _this._sturfeeXRConfig.accessKey
      )
      _this._localizationManager
        ._init()
        .then(function () {
          resolve()
        })
        .catch(function (err) {
          console.log(
            'ERROR :: Failed to initialized localization client (' + err + ')'
          )
          reject(err)
        })
    })
  }
  return SturfeeXRSessionManager
})()
