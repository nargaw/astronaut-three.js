import './style.css'
import * as THREE from 'three'
import * as dat from 'dat.gui'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import img from './img/particle.png'
import fragment from './shaders/fragment.glsl'
import vertex from './shaders/vertex.glsl'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass'
const canvas = document.querySelector('.webgl')

class NewScene{
    constructor(){
        this._Init()
    }
    
    _Init(){
        this.scene = new THREE.Scene()
        this.clock = new THREE.Clock()
        this.gltfLoader = new GLTFLoader()
        this.InitSettings()
        this.Texture()
        this.Model()
        this.InitCamera()
        this.InitRenderer()
        this.InitPostProcessing()
        this.BoxParticles()
        this.InitLights()
        this.InitControls()
        this.Update()
        window.addEventListener('resize', () => {
            this.Resize()
        })
    }

    InitSettings(){
        this.settings = {
            progress: 0,
            bloomStrength: 0.8,
            bloomRadius: 0.6,
            bloomThreshold: 0.2
        }
        this.gui = new dat.GUI()
        //this.gui.add(this.settings, 'progress', 0, 1, 0.01)
        this.gui.add(this.settings, 'bloomStrength', 0, 10, 0.01)
        this.gui.add(this.settings, 'bloomRadius', 0, 10, 0.01)
        this.gui.add(this.settings, 'bloomThreshold', 0, 10, 0.01)
    }

    Texture(){
        this.textureLoader = new THREE.TextureLoader()
        this.image = this.textureLoader.load(img)
        this.modelTexture = this.textureLoader.load('baked.jpg')
        this.modelTexture.flipY = false
        this.modelTexture.encoding = THREE.sRGBEncoding
    }

    Model(){
        this.modelMaterial = new THREE.MeshBasicMaterial({
            map: this.modelTexture,
            transparent: true,
            alphaTest: 1.0
        })
        this.gltfLoader.load(
            'astronaut.glb', (gltf) => {
                gltf.scene.traverse((child) => {
                    child.material = this.modelMaterial
                })
                this.scene.add(gltf.scene)
    
            }
        )
    }
    BoxParticles(){
        
        //this.geometry = new THREE.BoxGeometry(1, 1, 1, 200, 20, 20),
        this.material = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            uniforms: {
                u_time: { value: 0},
                u_texture: { value: this.image }
            },
            fragmentShader: fragment,
            vertexShader: vertex,
            transparent: true,
            depthTest: false,
            depthWrite: false
        })
        this.spiritMaterial = new THREE.PointsMaterial({ 
            size: 1.0, 
            map: this.image, 
            blending: THREE.AdditiveBlending, 
            depthTest: false, 
            transparent: true 
        });
        this.count = 2000
        this.vertices = []
        this.particleGeometry = new THREE.BufferGeometry()
        this.positions = new THREE.BufferAttribute(new Float32Array(this.count * 3), 3)
        for(let i = 0; i < this.count; i++){

            const pX = Math.random() * 500 - 250
            const pY = Math.random() * 500 - 250
            const pZ = Math.random() * 500 - 250

            this.vertices.push(pX, pY, pZ)
        }
        this.particleGeometry.setAttribute(
            'position', new THREE.Float32BufferAttribute(this.vertices, 3)
        )
        this.particles = new THREE.Points(this.particleGeometry,this.spiritMaterial)
        this.scene.add(this.particles)
    }
    
    InitRenderer(){
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
        })
        this.renderer.outputEncoding = THREE.sRGBEncoding
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        //this.renderer.render(this.scene, this.camera)
    }

    InitPostProcessing(){
        this.renderScene = new RenderPass(this.scene, this.camera)
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.6, 0.8, 0.05)
        this.composer = new EffectComposer(this.renderer)
        this.composer.addPass(this.renderScene)
        this.composer.addPass(this.bloomPass)
        
    }

    InitCamera(){
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000)
        this.camera.position.set(10, 9, 20)
        this.scene.add(this.camera)
    }

    InitLights(){
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
        this.scene.add(this.ambientLight)
    }

    InitControls(){
        this.controls = new OrbitControls(this.camera, canvas)
        this.controls.enableDamping = true
        this.controls.autoRotate = true
        this.controls.autoRotateSpeed = 0.5
        this.controls.update()
    }

    Resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    Update(){
        requestAnimationFrame(() => {
            this.elapsedTime = this.clock.getElapsedTime()
            this.material.uniforms.u_time.value = this.elapsedTime
            if(this.bloomPass){
                this.bloomPass.threshold = this.settings.bloomThreshold
                this.bloomPass.strength = this.settings.bloomStrength
                this.bloomPass.radius = this.settings.bloomRadius
                this.composer.render(this.scene, this.camera)
            }   
            //this.renderer.render(this.scene, this.camera)
            this.controls.update()
            this.Update()
        })  
    }
}

let _APP = null

window.addEventListener('DOMContentLoaded', () => {
    _APP = new NewScene()
})