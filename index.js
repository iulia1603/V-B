const express= require("express");
const path= require("path");
const fs = require("fs");
const sharp = require("sharp");
const sass = require("sass"); // ADĂUGAT pentru compilarea SCSS

app= express();

v=[10,27,23,44,15]

nrImpar=v.find(function(elem){return elem % 100 == 1})
console.log(nrImpar)

console.log("Folderul proiectului: ", __dirname)
console.log("Calea fisierului index.js: ", __filename)
console.log("Folderul curent de lucru: ", process.cwd())

app.set("view engine", "ejs");

obGlobal={
    obErori:null,
    obGalerie:null,
    // ========== ADĂUGAT pentru SCSS ========== 
    folderScss: path.join(__dirname, "resurse", "scss"),
    folderCss: path.join(__dirname, "resurse", "css")
    // ========== SFÂRȘITUL ADĂUGĂRII ==========
}

// ========== FUNCȚII PENTRU SHARP ========== 

async function genereazaImaginiMici() {
    if (!obGlobal.obGalerie || !obGlobal.obGalerie.imagini) {
        return;
    }

    const folderOriginal = path.join(__dirname, "resurse/imagini/galerie");
    const folderMic = path.join(__dirname, "resurse/imagini/galerie/small");

    // Creează folderul pentru imagini mici dacă nu există
    if (!fs.existsSync(folderMic)) {
        fs.mkdirSync(folderMic, { recursive: true });
        console.log("Creat folder pentru imagini mici:", folderMic);
    }

    for (let imagine of obGlobal.obGalerie.imagini) {
        const caleaOriginala = path.join(folderOriginal, imagine.cale_relativa);
        const caleaMica = path.join(folderMic, imagine.cale_relativa);

        try {
            // Verifică dacă imaginea originală există
            if (fs.existsSync(caleaOriginala)) {
                // Verifică dacă imaginea mică există deja
                if (!fs.existsSync(caleaMica)) {
                    console.log(`Generez imagine mică pentru: ${imagine.cale_relativa}`);
                    
                    await sharp(caleaOriginala)
                        .resize(400, 300, {
                            fit: 'cover',
                            position: 'center'
                        })
                        .jpeg({ 
                            quality: 85,
                            progressive: true 
                        })
                        .toFile(caleaMica);
                    
                    console.log(`✓ Generată: ${imagine.cale_relativa}`);
                } else {
                    console.log(`Imaginea mică există deja: ${imagine.cale_relativa}`);
                }
            } else {
                console.warn(`⚠️ Imaginea originală nu există: ${caleaOriginala}`);
            }
        } catch (error) {
            console.error(`Eroare la generarea imaginii ${imagine.cale_relativa}:`, error);
        }
    }
}

// Middleware pentru servirea imaginilor mici cu generare automată
async function serveSmallImage(req, res, next) {
    const imageName = req.params.imagine;
    const folderMic = path.join(__dirname, "resurse/imagini/galerie/small");
    const caleaMica = path.join(folderMic, imageName);
    const careaOriginala = path.join(__dirname, "resurse/imagini/galerie", imageName);

    try {
        // Dacă imaginea mică există, o servește
        if (fs.existsSync(caleaMica)) {
            return res.sendFile(caleaMica);
        }

        // Dacă nu există, încearcă să o genereze
        if (fs.existsSync(careaOriginala)) {
            console.log(`Generez la cerere imagine mică pentru: ${imageName}`);
            
            // Creează folderul dacă nu există
            if (!fs.existsSync(folderMic)) {
                fs.mkdirSync(folderMic, { recursive: true });
            }

            await sharp(careaOriginala)
                .resize(400, 300, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ 
                    quality: 85,
                    progressive: true 
                })
                .toFile(caleaMica);

            console.log(`✓ Generată la cerere: ${imageName}`);
            return res.sendFile(caleaMica);
        }

        // Dacă nici originala nu există, continuă cu next()
        next();
    } catch (error) {
        console.error(`Eroare la servirea imaginii ${imageName}:`, error);
        next();
    }
}

// ========== SFÂRȘITUL FUNCȚIILOR SHARP ==========

// ========== FUNCȚII PENTRU COMPILAREA SCSS ========== 

/**
 * Compilează un fișier SCSS în CSS cu backup automat
 * @param {string} caleScss - Calea către fișierul SCSS (absolută sau relativă la folderScss)
 * @param {string} caleCss - Calea către fișierul CSS de ieșire (absolută sau relativă la folderCss, opțională)
 */
function compileazaScss(caleScss, caleCss) {
    try {
        // ========== 1. DETERMINAREA CĂILOR ========== 
        let caleScssAbsoluta, caleCssAbsoluta;
        
        // Verifică dacă caleScss este absolută
        if (path.isAbsolute(caleScss)) {
            caleScssAbsoluta = caleScss;
        } else {
            caleScssAbsoluta = path.join(obGlobal.folderScss, caleScss);
        }
        
        // Verifică dacă caleCss este furnizată
        if (!caleCss) {
            // Generează numele CSS din numele SCSS
            const numeScss = path.basename(caleScssAbsoluta, '.scss');
            caleCss = numeScss + '.css';
        }
        
        // Verifică dacă caleCss este absolută
        if (path.isAbsolute(caleCss)) {
            caleCssAbsoluta = caleCss;
        } else {
            caleCssAbsoluta = path.join(obGlobal.folderCss, caleCss);
        }
        
        console.log(`📦 Compilez SCSS: ${path.basename(caleScssAbsoluta)} → ${path.basename(caleCssAbsoluta)}`);
        
        // ========== 2. VERIFICAREA EXISTENȚEI FIȘIERULUI SCSS ========== 
        if (!fs.existsSync(caleScssAbsoluta)) {
            console.error(`❌ Fișierul SCSS nu există: ${caleScssAbsoluta}`);
            return false;
        }
        
        // ========== 3. BACKUP FIȘIERULUI CSS EXISTENT ========== 
        if (fs.existsSync(caleCssAbsoluta)) {
            try {
                const folderBackup = path.join(__dirname, "backup", "resurse", "css");
                
                // Creează folderul backup dacă nu există
                if (!fs.existsSync(folderBackup)) {
                    fs.mkdirSync(folderBackup, { recursive: true });
                    console.log(`📁 Creat folder backup: ${folderBackup}`);
                }
                
                // Generează numele backup cu timestamp
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const numeBackup = `${path.basename(caleCssAbsoluta, '.css')}_${timestamp}.css`;
                const caleBackup = path.join(folderBackup, numeBackup);
                
                // Copiază fișierul CSS în backup
                fs.copyFileSync(caleCssAbsoluta, caleBackup);
                console.log(`💾 Backup salvat: ${numeBackup}`);
                
            } catch (error) {
                console.error(`❌ Eroare la crearea backup-ului pentru ${path.basename(caleCssAbsoluta)}:`, error.message);
                // Continuăm cu compilarea chiar dacă backup-ul eșuează
            }
        }
        
        // ========== 4. COMPILAREA SCSS ========== 
        const rezultat = sass.compile(caleScssAbsoluta, {
            style: 'expanded', // 'expanded' sau 'compressed'
            sourceMap: true
        });
        
        // ========== 5. SALVAREA FIȘIERULUI CSS ========== 
        // Creează folderul CSS dacă nu există
        const folderCssParent = path.dirname(caleCssAbsoluta);
        if (!fs.existsSync(folderCssParent)) {
            fs.mkdirSync(folderCssParent, { recursive: true });
        }
        
        // Scrie fișierul CSS
        fs.writeFileSync(caleCssAbsoluta, rezultat.css);
        
        // Scrie și source map-ul dacă există
        if (rezultat.sourceMap) {
            const caleSourceMap = caleCssAbsoluta + '.map';
            fs.writeFileSync(caleSourceMap, JSON.stringify(rezultat.sourceMap));
        }
        
        console.log(`✅ SCSS compilat cu succes: ${path.basename(caleScssAbsoluta)} → ${path.basename(caleCssAbsoluta)}`);
        return true;
        
    } catch (error) {
        console.error(`❌ Eroare la compilarea SCSS ${caleScss}:`, error.message);
        return false;
    }
}

/**
 * Compilează toate fișierele SCSS din folderScss
 */
function compileazaTotScss() {
    console.log('\n🔄 Compilare inițială SCSS...');
    
    if (!fs.existsSync(obGlobal.folderScss)) {
        console.log(`📁 Folderul SCSS nu există: ${obGlobal.folderScss}`);
        return;
    }
    
    try {
        const fisiere = fs.readdirSync(obGlobal.folderScss);
        const fisiereScss = fisiere.filter(fisier => fisier.endsWith('.scss'));
        
        if (fisiereScss.length === 0) {
            console.log('📝 Nu există fișiere SCSS de compilat');
            return;
        }
        
        console.log(`📦 Găsite ${fisiereScss.length} fișiere SCSS`);
        
        let succese = 0;
        fisiereScss.forEach(fisier => {
            if (compileazaScss(fisier)) {
                succese++;
            }
        });
        
        console.log(`✅ Compilare inițială completă: ${succese}/${fisiereScss.length} fișiere compilate cu succes\n`);
        
    } catch (error) {
        console.error('❌ Eroare la compilarea inițială SCSS:', error.message);
    }
}

/**
 * Inițializează urmărirea automată a fișierelor SCSS
 */
function initializeazaWatchScss() {
    if (!fs.existsSync(obGlobal.folderScss)) {
        console.log(`📁 Folderul SCSS nu există pentru urmărire: ${obGlobal.folderScss}`);
        return;
    }
    
    console.log(`👀 Urmărire automată SCSS activată: ${obGlobal.folderScss}`);
    
    try {
        const watcher = fs.watch(obGlobal.folderScss, { recursive: true }, (eventType, filename) => {
            if (!filename || !filename.endsWith('.scss')) {
                return; // Ignoră fișierele care nu sunt SCSS
            }
            
            const caleCompletaScss = path.join(obGlobal.folderScss, filename);
            
            // Verifică dacă fișierul există (pentru evenimentele de creare/modificare)
            if (fs.existsSync(caleCompletaScss)) {
                console.log(`\n🔔 Detectată modificare SCSS: ${filename}`);
                
                // Delay mic pentru a evita compilările multiple pentru același fișier
                setTimeout(() => {
                    if (fs.existsSync(caleCompletaScss)) { // Verifică din nou că fișierul încă există
                        compileazaScss(filename);
                    }
                }, 100);
            }
        });
        
        // Gestionarea erorilor pentru watcher
        watcher.on('error', (error) => {
            console.error('❌ Eroare la urmărirea fișierelor SCSS:', error.message);
        });
        
        // Curățare la închiderea aplicației
        process.on('SIGINT', () => {
            console.log('\n🛑 Oprire urmărire SCSS...');
            watcher.close();
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            watcher.close();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Eroare la inițializarea urmăririi SCSS:', error.message);
    }
}

// ========== SFÂRȘITUL FUNCȚIILOR SCSS ==========

v=[10,27,23,44,15]

nrImpar=v.find(function(elem){return elem % 100 == 1})
console.log(nrImpar)

console.log("Folderul proiectului: ", __dirname)
console.log("Calea fisierului index.js: ", __filename)
console.log("Folderul curent de lucru: ", process.cwd())

app.set("view engine", "ejs");

obGlobal={
    obErori:null,
    obGalerie:null,
    // ========== ADĂUGAT pentru SCSS ========== 
    folderScss: path.join(__dirname, "resurse", "scss"),
    folderCss: path.join(__dirname, "resurse", "css")
    // ========== SFÂRȘITUL ADĂUGĂRII ==========
}


function initErori(){
    let continut = fs.readFileSync(path.join(__dirname,"resurse/json/erori.json")).toString("utf-8");
    console.log(continut)
    obGlobal.obErori=JSON.parse(continut)
    console.log(obGlobal.obErori)
    
    obGlobal.obErori.eroare_default.imagine=path.join(obGlobal.obErori.cale_baza, obGlobal.obErori.eroare_default.imagine)
    for (let eroare of obGlobal.obErori.info_erori){
        eroare.imagine=path.join(obGlobal.obErori.cale_baza, eroare.imagine)
    }
    console.log(obGlobal.obErori)

}

function initGalerie(){
    try {
        let continut = fs.readFileSync(path.join(__dirname,"resurse/json/galerie.json")).toString("utf-8");
        obGlobal.obGalerie = JSON.parse(continut);
        console.log("Galerie încărcată:", obGlobal.obGalerie.imagini.length, "imagini");
        
        // Adăugăm calea completă pentru fiecare imagine
        for (let imagine of obGlobal.obGalerie.imagini) {
            imagine.cale_completa = path.posix.join(obGlobal.obGalerie.cale_baza, imagine.cale_relativa);
            // Adăugăm calea pentru imaginea mică
            imagine.cale_mica = path.posix.join(obGlobal.obGalerie.cale_baza, "small", imagine.cale_relativa);
            
            // Setăm alt text: fie din JSON, fie numele imaginii
            if (!imagine.alt || imagine.alt.trim() === "") {
                imagine.alt = imagine.nume;
            }
        }
        
        // Generăm imaginile mici la pornirea serverului
        genereazaImaginiMici().then(() => {
            console.log("✓ Procesarea imaginilor mici completă");
        }).catch(err => {
            console.error("Eroare la generarea imaginilor mici:", err);
        });
        
    } catch (err) {
        console.error("Eroare la încărcarea galeriei:", err);
        obGlobal.obGalerie = { imagini: [] };
    }
}

function getImaginiPentruTimp() {
    if (!obGlobal.obGalerie || !obGlobal.obGalerie.imagini) {
        return [];
    }
    
    const oraActuala = new Date().getHours();
    let timpCurent;
    
    // Determinăm perioada zilei
    if (oraActuala >= 5 && oraActuala < 12) {
        timpCurent = "dimineata";
    } else if (oraActuala >= 12 && oraActuala < 20) {
        timpCurent = "zi";
    } else {
        timpCurent = "noapte";
    }
    
    console.log(`Ora actuală: ${oraActuala}, Perioada: ${timpCurent}`);
    
    // Filtrăm imaginile pentru perioada curentă
    let imaginiFiltrate = obGlobal.obGalerie.imagini.filter(imagine => imagine.timp === timpCurent);
    
    console.log(`Imagini filtrate pentru ${timpCurent}:`, imaginiFiltrate.length);
    
    // ========== CONDIȚIA PENTRU MINIM 6 IMAGINI ȘI DIVIZIBIL CU 3 ==========
    let numarImagini = imaginiFiltrate.length;
    
    if (numarImagini > 0) {
        // Truncăm la cel mai mare număr divizibil cu 3
        // Exemplu: 
        // - 10 imagini -> Math.floor(10/3) * 3 = 3 * 3 = 9 imagini
        // - 8 imagini -> Math.floor(8/3) * 3 = 2 * 3 = 6 imagini  
        // - 7 imagini -> Math.floor(7/3) * 3 = 2 * 3 = 6 imagini
        numarImagini = Math.floor(numarImagini / 3) * 3;
        
        // Siguranță: dacă cumva rezultatul este 0, setăm la 3
        if (numarImagini === 0) numarImagini = 3;
    }
    // Dacă sunt mai puțin de 6 imagini, le afișăm pe toate (nu aplicăm regula)
    
    console.log(`Numărul final de imagini (divizibil cu 3): ${numarImagini}`);
    // ========== SFÂRȘITUL CONDIȚIEI ==========
    
    return imaginiFiltrate.slice(0, numarImagini);
}

// Vector cu numele folderelor care trebuie create - MODIFICAT pentru a include backup
const vect_foldere = [
    "temp", 
    "resurse/json", 
    "resurse/imagini/galerie", 
    "resurse/imagini/galerie/small",
    "backup", // ADĂUGAT
    "backup/resurse/css", // ADĂUGAT
    "resurse/scss" // ADĂUGAT pentru a crea folderul SCSS dacă nu există
];

// Crearea folderelor dacă nu există
for (let folder of vect_foldere) {
    let cale_folder = path.join(__dirname, folder);
    if (!fs.existsSync(cale_folder)) {
        fs.mkdirSync(cale_folder, { recursive: true });
        console.log("Creat folder:", cale_folder);
    }
}

initErori()
initGalerie()

// ========== INIȚIALIZAREA SCSS ========== 
// Compilare inițială și activarea urmăririi
compileazaTotScss();
initializeazaWatchScss();
// ========== SFÂRȘITUL INIȚIALIZĂRII SCSS ==========

function afisareEroare(res, identificator, titlu, text, imagine){
    let eroare= obGlobal.obErori.info_erori.find(function(elem){ 
                        return elem.identificator==identificator
                    });
    if(eroare){
        if(eroare.status)
            res.status(identificator)
        var titluCustom=titlu || eroare.titlu;
        var textCustom=text || eroare.text;
        var imagineCustom=imagine || eroare.imagine;


    }
    else{
        var err=obGlobal.obErori.eroare_default
        var titluCustom=titlu || err.titlu;
        var textCustom=text || err.text;
        var imagineCustom=imagine || err.imagine;


    }
    res.render("pagini/eroare", { //transmit obiectul locals
        titlu: titluCustom,
        text: textCustom,
        imagine: imagineCustom
    })
}

// ========== MIDDLEWARE PENTRU IMAGINILE MICI ========== 
// Middleware pentru servirea imaginilor mici (cu Sharp)
app.get("/resurse/imagini/galerie/small/:imagine", serveSmallImage);
// ========== SFÂRȘITUL MIDDLEWARE-ULUI ==========

// Middleware pentru verificarea dacă se încearcă accesarea unui director în /resurse
app.use("/resurse", function(req, res, next) {
    const fullPath = path.join(__dirname, "resurse", req.path);
    
    // Verificăm dacă este un director și nu conține un index.html
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        const indexPath = path.join(fullPath, "index.html");
        if (!fs.existsSync(indexPath)) {
            // Returnăm eroarea 403 dacă se încearcă accesarea unui director fără index.html
            return afisareEroare(res, 403);
        }
    }
    next();
});

// Servirea fișierelor statice după verificarea directorului
app.use("/resurse", express.static(path.join(__dirname,"resurse")))

app.get("/favicon.ico", function(req, res){
    res.sendFile(path.join(__dirname, "resurse/imagini/favicon/favicon.ico"))
})

app.get(["/","/index","/home"], function(req, res){
    const imaginiGalerie = getImaginiPentruTimp();
    res.render("pagini/index", {
        ip: req.ip,
        imagini: imaginiGalerie
    });
})

app.get("/despre", function(req, res){
     res.render("pagini/despre");
})


// Ruta pentru pagina separată de galerie
app.get("/galerie", function(req, res){
    const imaginiGalerie = getImaginiPentruTimp();
    res.render("pagini/galerie", {
        imagini: imaginiGalerie,
        timpCurent: new Date().getHours() >= 5 && new Date().getHours() < 12 ? "dimineața" :
                   new Date().getHours() >= 12 && new Date().getHours() < 20 ? "ziua" : "noaptea"
    });
})

app.get("/index/a", function(req, res){
    const imaginiGalerie = getImaginiPentruTimp();
    res.render("pagini/index", {
        imagini: imaginiGalerie
    });
})


app.get("/cerere", function(req, res){
    res.send("<p style='color:blue'>Buna ziua</p>")
})


app.get("/fisier", function(req, res, next){
    res.sendfile(path.join(__dirname,"package.json"));
})


app.get("/abc", function(req, res, next){
    res.write("Data curenta: ")
    next()
})

app.get("/abc", function(req, res, next){
    res.write((new Date())+"")
    res.end()
    next()
})


app.get("/abc", function(req, res, next){
    console.log("------------")
})

app.get("/*.ejs", function(req, res, next){
    afisareEroare(res,400);
})


app.get("/*", function(req, res, next){
    try{
        res.render("pagini"+req.url,function (err, rezultatRandare){
            if (err){
                if(err.message.startsWith("Failed to lookup view")){
                    afisareEroare(res,404);
                }
                else{
                    afisareEroare(res);
                }
            }
            else{
                console.log(rezultatRandare);
                res.send(rezultatRandare)
            }
        });
    }
    catch(errRandare){
        if(errRandare.message.startsWith("Cannot find module")){
            afisareEroare(res,404);
        }
        else{
            afisareEroare(res);
        }
    }
})



app.listen(8080);
console.log("Serverul a pornit")