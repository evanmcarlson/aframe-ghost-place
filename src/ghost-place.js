const ghostPlaceComponent = {
  schema: {
    opaqueOpacity: {type: 'number', default: 1},
    opacity: {type: 'number', default: 0.1},
    yOffset: {type: 'number', default: 0.1},
  },
  init() {
    this.raycaster = new THREE.Raycaster()
    this.camera = document.querySelector('a-camera')
    this.threeCamera = this.camera.getObject3D('camera')
    this.ground = document.getElementById('ground')
    this.rayOrigin = new THREE.Vector2(0, 0)
    this.cursorLocation = new THREE.Vector3(0, 0, 0)

    let placeEntity
    let {opacity} = this.data
    let hasShadow = false

    if (!this.ground) {
      console.error('No ground plane found. Please set id="ground" on the ground plane.')
    }
    if (this.el.hasAttribute('shadow')) {
      hasShadow = true
      this.el.setAttribute('shadow', {cast: false})
    }

    const updateOpacity = (el) => {
      el.getObject3D('mesh') && el.getObject3D('mesh').traverse((node) => {
        if (node.isMesh) {
          node.material.opacity = opacity
          node.material.transparent = opacity < 1.0
          node.material.needsUpdate = true
        }
      })
      el.sceneEl.addEventListener('touchstart', placeEntity)
      el.removeEventListener('model-loaded', updateOpacity)
    }

    placeEntity = () => {
      this.el.sceneEl.removeEventListener('touchstart', placeEntity)
      this.el.sceneEl.emit('placed')
      opacity = this.data.opaqueOpacity
      updateOpacity(this.el)
      if (hasShadow) {
        this.el.setAttribute('shadow', {cast: true})
      }
      this.el.removeAttribute('ghost-place')
    }

    const callback = (el) => {
      if (el.hasAttribute('gltf-model')) {
        // added to a 3D model
        el.addEventListener('model-loaded', () => {
          updateOpacity(el)
        })
      } else {
      // added to a primitive
        updateOpacity(el)
      }
    }

    // if the entity has children modify the opacity of each one
    if (this.el.children.length === 0) {
      callback(this.el)
    } else {
      Array.from([this.el, ...this.el.children]).forEach((child) => {
        callback(child)
      })
    }
  },
  tick() {
    if (this.el.object3D) {
      // Raycast from camera to ground
      this.raycaster.setFromCamera(this.rayOrigin, this.threeCamera)
      const intersects = this.raycaster.intersectObject(this.ground.object3D, true)
      if (intersects.length > 0) {
        const [intersect] = intersects
        this.cursorLocation = intersect.point
      }
      this.el.object3D.position.y = this.data.yOffset
      this.el.object3D.position.lerp(this.cursorLocation, 0.4)
      this.el.object3D.rotation.y = this.camera.object3D.rotation.y
    }
  },
}
export {ghostPlaceComponent}
