class HSLHelper {
  constructor(color) {
    this.color = color;
    this.temp = {h: 0, s: 0, l: 0};
  }
  get h() { return this.color.getHSL(this.temp).h; }
  set h(h) {
    const {s, l} = this.color.getHSL(this.temp);
    this.color.setHSL(h, s, l);
  }
  get s() { return this.color.getHSL(this.temp).s; }
  set s(s) {
    const {h, l} = this.color.getHSL(this.temp);
    this.color.setHSL(h, s, l);
  }
  get l() { return this.color.getHSL(this.temp).l; }
  set l(l) {
    const {h, s} = this.color.getHSL(this.temp);
    this.color.setHSL(h, s, l);
  }
}

var noise = new SimplexNoise();

var vizInit = function (){
  
  var file = document.getElementById("thefile");
  var audio = document.getElementById("audio");
  var fileLabel = document.querySelector("label.file");

  
  
  document.onload = function(e){
    console.log(e);
    audio.play();
    play();
  }
  file.onchange = function(){
    fileLabel.classList.add('normal');
    audio.classList.add('active');
    var files = this.files;
    
    audio.src = URL.createObjectURL(files[0]);
    audio.load();
    audio.play();
    play();
  }
  
function play() {
    audio.style.visibility = "visible";
    var context = new AudioContext();
    var src = context.createMediaElementSource(audio);
    var analyser = context.createAnalyser();
    src.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = 512;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    var scene = new THREE.Scene();
    var aspect = window.innerWidth / window.innerHeight;

	  var camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set( 20, 40, 20 );
	  camera.lookAt( scene.position );
    scene.add(camera); 

    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    var geometry = new THREE.PlaneGeometry( 400, 400, 40, 40);
    var material = new THREE.MeshStandardMaterial( { wireframe: true, opacity: 0.3, transparent: true, side: THREE.DoubleSide} );
    var grid = new THREE.Mesh( geometry, material );
    grid.rotation.order = 'YXZ';
    grid.material.color.setHex(0x00ff00);
    grid.rotation.x = - Math.PI / 2;
    grid.position.set(0,-20,0);
    scene.add( grid );
    
		
    var geometry1 = new THREE.IcosahedronGeometry(4, 4);
    var material1 = new THREE.MeshLambertMaterial( {wireframe: true , transparent: false} );
    var ball = new THREE.Mesh( geometry1, material1 );

    ball.position.set(0,5,0);
  	scene.add( ball);

    var ambientLight = new THREE.AmbientLight(
    	0x00ff00, 0.15
    );
    
    scene.add(ambientLight);
    
    var spotLight = new THREE.SpotLight(0x00ff00);
    spotLight.intensity = 1;
    spotLight.position.set(-80, 100, 60);
    spotLight.lookAt(ball);
    spotLight.power = 5;
    spotLight.castShadow = true;
    scene.add(spotLight);

    const helper1 = new HSLHelper(ambientLight.color);
    const tl1 = new TimelineMax();
    tl1.fromTo(helper1, {h: 0, s: 1, l: 0.5}, {duration: 25, h: 1, s: 1, l: 0.5, ease:Linear.easeNone});
    tl1.repeat(-1);

    const helper2 = new HSLHelper(spotLight.color);
    const tl2 = new TimelineMax();
    tl2.fromTo(helper2, {h: 0, s: 1, l: 0.5}, {duration: 25, h: 1, s: 1, l: 0.5, ease:Linear.easeNone});
    tl2.repeat(-1);

    const helper3 = new HSLHelper(grid.material.color);
    const tl3 = new TimelineMax();
    tl3.fromTo(helper3, {h: 0, s: 1, l: 0.5}, {duration: 25, h: 1, s: 1, l: 0.5, ease:Linear.easeNone});
    tl3.repeat(-1);

    document.getElementById('out').appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    render();

    function render() {
      analyser.getByteFrequencyData(dataArray);

      var lowerHalfArray = dataArray.slice(0, (dataArray.length/2) - 1);
      var upperHalfArray = dataArray.slice((dataArray.length/2) - 1, dataArray.length - 1);

      var overallAvg = avg(dataArray);
      var lowerMax = max(lowerHalfArray);
      var lowerAvg = avg(lowerHalfArray);
      var upperMax = max(upperHalfArray);
      var upperAvg = avg(upperHalfArray);

      var lowerMaxFr = lowerMax / lowerHalfArray.length;
      var lowerAvgFr = lowerAvg / lowerHalfArray.length;
      var upperMaxFr = upperMax / upperHalfArray.length;
      var upperAvgFr = upperAvg / upperHalfArray.length;

      makeRoughGround(grid, modulate(lowerMaxFr, 0, 0.5, 0.5, 2));
      
      makeRoughBall(ball, modulate(Math.pow(lowerMaxFr, 0.4), 0, 1, 0, 6), modulate(upperAvgFr, 0, 1, 0, 3));

      ball.rotation.y += 0.003;
      
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function makeRoughBall(mesh, bassFr, treFr) {
        mesh.geometry.vertices.forEach(function (vertex, i) {
            var offset = mesh.geometry.parameters.radius;
            var amp = 5;
            var time = window.performance.now();
            vertex.normalize();
            var rf = 0.00001;
            var distance = (offset+bassFr) + noise.noise3D(vertex.x + time *rf*7, vertex.y +  time*rf*8, vertex.z + time*rf*9) * amp * treFr;
            vertex.multiplyScalar(distance);
        });
        mesh.geometry.verticesNeedUpdate = true;
        mesh.geometry.normalsNeedUpdate = true;
        mesh.geometry.computeVertexNormals();
        mesh.geometry.computeFaceNormals();
    }

    function makeRoughGround(mesh, distortionFr) {
        mesh.geometry.vertices.forEach(function (vertex, i) {
            var amp = 0.3;
            var time = Date.now();
            var distance = (noise.noise2D(vertex.x + time * 0.0003,  vertex.y + time * 0.0001) + 0) * distortionFr * amp;
            vertex.z = distance;
        });
        mesh.geometry.verticesNeedUpdate = true;
        mesh.geometry.normalsNeedUpdate = true;
        mesh.geometry.computeVertexNormals();
        mesh.geometry.computeFaceNormals();
    }
    
    function makeRoughPlane(mesh, distortionFr) {
        mesh.geometry.vertices.forEach(function (vertex, i) {
            var amp = 2;
            var time = Date.now();
            var distance = (noise.noise2D(vertex.x + time * 0.0001,  (Math.sin(Math.PI * 8 ) ) / 20 + time * 0.0001) + 0) * distortionFr * amp;
            vertex.z = distance;
            
        });
        
        
        mesh.geometry.verticesNeedUpdate = true;
        mesh.geometry.normalsNeedUpdate = true;
        mesh.geometry.computeVertexNormals();
        mesh.geometry.computeFaceNormals();
    }


    audio.play();
  };
}

window.onload = vizInit();

document.body.addEventListener('touchend', function(ev) { context.resume(); });

function fractionate(val, minVal, maxVal) {
    return (val - minVal)/(maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
    var fr = fractionate(val, minVal, maxVal);
    var delta = outMax - outMin;
    return outMin + (fr * delta);
}

function avg(arr){
    var total = arr.reduce(function(sum, b) { return sum + b; });
    return (total / arr.length);
}

function max(arr){
    return arr.reduce(function(a, b){ return Math.max(a, b); })
}

