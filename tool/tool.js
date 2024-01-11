const inputDiv = document.querySelector(".input-div")
const input = document.querySelector("input")
const animdisplay = document.querySelector("#animdisplay")
const warning = document.querySelector("#warning")

const animcanvas = document.getElementById("animcanvas");
const rotctx = animcanvas.getContext("2d");

const tablecanvas = document.getElementById("tablecanvas");
const tablectx = tablecanvas.getContext("2d");

image = new Image();
image.onload = () => {
    Promise.all([
        // Cut out two sprites from the sprite sheet
        createImageBitmap(image, 0, 0, 64, 64),
    ]).then((sprites) => {
        // Draw each sprite onto the canvas
        tablectx.drawImage(image, 0, 0);
        rotctx.drawImage(image, 0, 0);
    });
};

image.src = "block.png";

let imagesArray = [];
let animid = 0;
let animlen = 0;

let tilew = 0;
let tileh = 0;

input.addEventListener("change", () => {
    const files = input.files;
    for (let i = 0; i < files.length; i++) {
        imagesArray.push(files[i]);
    }
    displayImages();
})

function displayImages() {

    clearwarn();

    animlen = imagesArray.length;

    let img = document.createElement('img');
    let iw = 0;
    let ih = 0;

    img.src = URL.createObjectURL(imagesArray[0]);

    img.onload = function(){
        iw = img.width;
        ih = img.height;

        tilew = iw;
        tileh = ih;

        tablectx.canvas.width = iw * animlen;
        tablectx.canvas.height = ih;

        let stack = 0

        if(animlen % 2 == 0){
            tablectx.canvas.width = iw * (animlen/2);
            tablectx.canvas.height = ih * 2;
            stack = 2;
        }

        if(animlen % 3 == 0){
            tablectx.canvas.width = iw * (animlen/3);
            tablectx.canvas.height = ih * 3;
            stack = 3;
        }

        if(animlen % 4 == 0){
            tablectx.canvas.width = iw * (animlen/4);
            tablectx.canvas.height = ih * 4;
            stack = 4;
        }

        if(stack != 0){
            addstat("🔠", "Stacking " + stack + " times for convenience.") //doesn't change file size lol
        }

        rotctx.canvas.width = iw;
        rotctx.canvas.height = ih;

        if((iw == 64 && ih == 64) || (iw == 400 && ih == 240)){
            addstat ("📐", iw + "x" + ih);
        }else{
            addwarn ("Image size (" + iw + "x" + ih + ") may be bad.");
        }

        if(animlen%45 == 0 || animlen == 1){
            addstat ("#️⃣", animlen);
        }else{
            addwarn ("Image count (" + animlen + ") may be bad.");
        }

    }

    console.log("draw");
    for (let i = 0; i < animlen; i++) {
        let sprite = document.createElement('img');
        sprite.src = URL.createObjectURL(imagesArray[i]);

        sprite.onload = function(){

            let x = (i * iw) % tablectx.canvas.width;
            let y = Math.floor((i * iw) / tablectx.canvas.width) * ih;
            
            tablectx.drawImage(sprite,x,y);
        }
    }

}

function deleteImage(index) {
    imagesArray.splice(index, imagesArray.length);
    displayImages();
}

function reload(){
    location.reload();
}

function dltable(){
    console.log("download canvas");
    download(tablecanvas, document.getElementById("blockname").value + "-table-" + tilew + "-" + tileh + ".png")
}

function dltablenoname(){
    console.log("download canvas");
    download(tablecanvas, document.getElementById("blockname").value + ".png")
}

function download(canvas, filename) {
    /// create an "off-screen" anchor tag
    var lnk = document.createElement('a'), e;
  
    /// the key here is to set the download attribute of the a tag
    lnk.download = filename;
  
    /// convert canvas content to data-uri for link. When download
    /// attribute is set the content pointed to by link will be
    /// pushed as "download" in HTML5 capable browsers
    lnk.href = canvas.toDataURL("image/png;base64");
  
    /// create a "fake" click-event to trigger the download
    if (document.createEvent) {
      e = document.createEvent("MouseEvents");
      e.initMouseEvent("click", true, true, window,
                       0, 0, 0, 0, 0, false, false, false,
                       false, 0, null);
  
      lnk.dispatchEvent(e);
    } else if (lnk.fireEvent) {
      lnk.fireEvent("onclick");
    }
}

function addstat(icon, msg){
    warning.innerHTML += "<p>" + icon + ` ${msg}</p>`
}

function addwarn(msg){
    warning.innerHTML += `<p>🛑 ${msg}</p>`
}

function clearwarn(){
    warning.innerHTML = ""
}

async function dither(idx){
    let blobcanvas = document.createElement("canvas");
    let bctx = blobcanvas.getContext("2d");

    createImageBitmap(imagesArray[idx]).then(bitmap=>{
        bctx.canvas.width = bitmap.width;
        bctx.canvas.height = bitmap.height;

        bctx.clearRect(0, 0, bctx.canvas.width, bctx.canvas.height);
        bctx.drawImage(bitmap,0,0)

        let ditherdata = [[16/17,  8/17, 14/17,  6/17], [ 4/17, 12/17,  2/17, 10/17], [13/17,  5/17, 15/17,  7/17], [ 1/17,  9/17,  3/17, 11/17]];
        let dw = ditherdata[0].length;
        let dh = ditherdata.length;

        let w = [0xb1, 0xae, 0xa8];
        let b = [0x32, 0x2f, 0x29];

        let cw = bctx.canvas.width;
        let ch = bctx.canvas.height;

        let power = document.getElementById("power").value;
        let data = bctx.getImageData(0,0,cw,ch);

        let i=0;
        let val = 0;

        for (let x = 0; x < ch; x++) {
            for (let y = 0; y < cw; y++) {
                i += 4;
                val = dithervalue(data.data, i);
                val = Math.pow(val, power);

                if(val > ditherdata[y%dh][x%dw]){
                    setpx(data.data, i, w)
                }else{
                    setpx(data.data, i, b)
                }
            }
        }

        bctx.putImageData(data, 0, 0);

        let dithered = dataURItoBlob(blobcanvas.toDataURL());

        imagesArray[idx] = new File([dithered], idx, { type: "image/png", });

        rendercount += 1;

        data = null;
    })
}

var rendercount = 0
function ditherall(){

    if(imagesArray.length == 0){
        console.log("can't dither");
        return;
    }

    console.log("dithering");
    rendercount = 0
    for (let i = 0; i < imagesArray.length; i++) {
        dither(i);
    }

    waitanddisplay();
}

function waitanddisplay(){
    if(rendercount != imagesArray.length) {
        //check the flag every 100 milliseconds
        window.setTimeout(waitanddisplay, 100);
    } else {
        displayImages();
    }
}

function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    let byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    let ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {type:mimeString});
}

//L* (D65/2°)
function dithervalue(data,i){
    let r,g,b;

    r = data[i];
    g = data[i+1];
    b = data[i+2];

    let Y, yr;

    r /= 255;
    g /= 255;
    b /= 255;

    r = ((r > 0.04045) ? Math.pow((r+0.055)/1.055,2.4) : r/12.92) * 100;
    g = ((g > 0.04045) ? Math.pow((g+0.055)/1.055,2.4) : g/12.92) * 100;
    b = ((b > 0.04045) ? Math.pow((b+0.055)/1.055,2.4) : b/12.92) * 100;

    Y = (0.2126*r + 0.7152*g + 0.0722*b) / 100;
    yr = (Y > 0.008856) ? Math.pow(Y, 1/3) : (7.787 * Y) + 16/116;

    let L = (116*yr)-16;

    return (L/100);
}

function setpx(data,i,color){
    data[i] = color[0];
    data[i+1] = color[1];
    data[i+2] = color[2];
}
    
let start, previousTimeStamp;

function animupdate(timeStamp) {

    if (start === undefined) {
        start = timeStamp;
    }   

    const elapsed = timeStamp - start;

    if(animlen != 0 && elapsed >= 33){

        createImageBitmap(imagesArray[animid]).then(imageBitmap=>{
            rotctx.clearRect(0, 0, rotctx.canvas.width, rotctx.canvas.height);
            rotctx.drawImage(imageBitmap,0,0)
        })

        animid += 1
        if(animid >= animlen){
            animid = 0
        }
        start = timeStamp;
    }
    
    previousTimeStamp = timeStamp;
    window.requestAnimationFrame(animupdate);
}

window.requestAnimationFrame(animupdate);