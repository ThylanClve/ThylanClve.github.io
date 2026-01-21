/*
CONFIGURATION PLOTLY 
*/

const configPlotly = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d']
};

const miseEnPagePlotly = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: {
        family: 'Montserrat, sans-serif',
        color: '#b3b3b3',
        size: 12
    },
    margin: { t: 40, r: 30, b: 70, l: 70 },
    xaxis: {
        gridcolor: '#282828',
        linecolor: '#282828',
        tickcolor: '#b3b3b3',
        zerolinecolor: '#282828'
    },
    yaxis: {
        gridcolor: '#282828',
        linecolor: '#282828',
        tickcolor: '#b3b3b3',
        zerolinecolor: '#282828'
    },
    hoverlabel: {
        bgcolor: '#1a1a1a',
        bordercolor: '#1DB954',
        font: { color: '#ffffff', size: 13 }
    },
    
    transition: {
        duration: 800,
        easing: 'cubic-in-out'
    }
};

const spotifyVert = '#1DB954';
const spotifyVertEclat = '#1ed760';






/*UTILITAIRES*/


function formaterNombre(nombre) {
    if (nombre >= 1e9) return (nombre / 1e9).toFixed(1) + 'Md'; // Milliards
    if (nombre >= 1e6) return (nombre / 1e6).toFixed(1) + 'M';  // Millions
    if (nombre >= 1e3) return (nombre / 1e3).toFixed(1) + 'k';  // Milliers
    return nombre.toString();
}

/**
 * Anime un compteur numérique ou affiche du texte en fondu
 * @param {string} idElement - L'ID de l'élément HTML à cibler
 * @param {number|string} valeurCible - La valeur finale à atteindre
 * @param {number} duree - La durée de l'animation en ms
 */
function animerCompteur(idElement, valeurCible, duree = 2000) {
    const element = document.getElementById(idElement);
    if (!element || !valeurCible) return;
    
    if (typeof valeurCible === 'number') {
        let valeurDepart = 0;
        const increment = valeurCible / (duree / 16); 
        
        const compteur = setInterval(() => {
            valeurDepart += increment;
            if (valeurDepart >= valeurCible) {
                element.textContent = Math.round(valeurCible);
                clearInterval(compteur);
            } else {
                element.textContent = Math.round(valeurDepart);
            }
        }, 16);
    } else {
        // Fade in pour mon texte
        element.style.opacity = '0';
        setTimeout(() => {
            element.textContent = valeurCible;
            element.style.transition = 'opacity 0.8s ease-in';
            element.style.opacity = '1';
        }, 300);
    }
}




 /* Effet pour le scroll */


function initialiserRevelationDefilement() {
    
    const elementsAReveler = document.querySelectorAll('.revelation-defilement');
    
    const revelerAuDefilement = () => {
        elementsAReveler.forEach(element => {
            const positionElement = element.getBoundingClientRect().top;
            const hauteurFenetre = window.innerHeight;
            
            if (positionElement < hauteurFenetre * 0.8) {
                element.classList.add('visible');
            }
        });
    };
    
    window.addEventListener('scroll', revelerAuDefilement);
    revelerAuDefilement(); 
}





 /* CHARGEMENT ET NETTOYAGE DES DONNÉES */


Papa.parse('most_streamed_spotify-2023.csv', {
    download: true,
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, 
    complete: function(resultats) {
        const donneesBrutes = resultats.data;
        console.log('📊 Données brutes chargées:', donneesBrutes.length, 'lignes');

        
     /* NETTOYAGE DES DONNÉES */
        
        const donneesNettoyees = donneesBrutes.map(ligne => {
            // Nettoyage des streams (enlève les virgules ou caractères non numériques)
            let streamsBrut = String(ligne['streams'] || '').trim();
            streamsBrut = streamsBrut.replace(/[^0-9]/g, ''); 
            
            const streams = parseInt(streamsBrut) || 0;
            
            return {
                nom_titre: String(ligne['track_name'] || '').trim(),
                nom_artiste: String(ligne['artist(s)_name'] || '').trim(),
                streams: streams,
                bpm: parseInt(ligne['bpm']) || 0,
                dansabilite: parseInt(ligne['danceability_%']) || 0,
                valence: parseInt(ligne['valence_%']) || 0,
                energie: parseInt(ligne['energy_%']) || 0,
                mois_sortie: parseInt(ligne['released_month']) || 0,
                jour_sortie: parseInt(ligne['released_day']) || 0,
                acousticness: parseInt(ligne['acousticness_%']) || 0,
            };
        }).filter(ligne => {
            
            return ligne.bpm > 0 && 
                   ligne.nom_titre.length > 0 && 
                   ligne.streams > 0 && 
                   ligne.streams < 4000000000; 
        });






        
       /* GÉNÉRATION DES VISUALISATIONS */
        
        calculerIndicateurs(donneesNettoyees);

        
        setTimeout(() => creerHistogrammeBPM(donneesNettoyees), 400);
        setTimeout(() => creerGraphiqueChaleur(donneesNettoyees), 600);
        setTimeout(() => creerBarresArtistes(donneesNettoyees), 800);
        setTimeout(() => creerGraphiqueMiroir(donneesNettoyees), 1000);


        


        
        initialiserRevelationDefilement();
    },
    error: function(erreur) {
        console.error('❌ Erreur de chargement du CSV:', erreur);
        const elementErreur = document.getElementById('indicateur-titre-top');
        if (elementErreur) elementErreur.textContent = 'Erreur de chargement';
    }
});










/*CALCUL DES INDICATEURS (KPIs) AVEC ANIMATION */


function calculerIndicateurs(donnees) {
    
    // INDICATEUR 1: Titre Champion (Top Track)
    const meilleurTitre = donnees.reduce((max, item) => 
        item.streams > max.streams ? item : max, donnees[0]);
    
    
    animerCompteur('indicateur-titre-top', meilleurTitre.nom_titre, 1500);
    setTimeout(() => {
        const sousTexte = document.getElementById('indicateur-titre-top-streams');
        if(sousTexte) sousTexte.textContent = formaterNombre(meilleurTitre.streams) + ' streams';
    }, 1500);

    // INDICATEUR 2: BPM Moyen
    const bpmMoyen = Math.round(
        donnees.reduce((somme, item) => somme + item.bpm, 0) / donnees.length
    );
    animerCompteur('indicateur-bpm-moyen', bpmMoyen, 2000);

    // INDICATEUR 3: Top Artiste
    const compteArtistes = {};
    donnees.forEach(item => {
        // On prend seulement le premier artiste si c'est un duo
        const artiste = item.nom_artiste.split(',')[0].trim();
        compteArtistes[artiste] = (compteArtistes[artiste] || 0) + 1;
    });
    
    const meilleurArtiste = Object.entries(compteArtistes)
        .sort((a, b) => b[1] - a[1])[0];
    
    animerCompteur('indicateur-artiste-top', meilleurArtiste[0], 1800);
    setTimeout(() => {
        const sousTexteArtiste = document.getElementById('indicateur-artiste-top-nombre');
        if(sousTexteArtiste) sousTexteArtiste.textContent = meilleurArtiste[1] + ' titres dans le top';
    }, 1800);
}











/*GRAPHIQUE 1: HISTOGRAMME POUR LE BPM */


function creerHistogrammeBPM(donnees) {
    const valeursBPM = donnees.map(d => d.bpm);

    const trace = {
        x: valeursBPM,
        type: 'histogram',
        marker: {
            color: spotifyVert,
            line: {
                color: spotifyVertEclat,
                width: 1.5
            }
        },
        opacity: 0.9,
        xbins: {
            size: 10 
        },
        hovertemplate: '<b>BPM:</b> %{x}<br><b>Titres:</b> %{y}<extra></extra>'
    };

    const layout = {
        ...miseEnPagePlotly,
        xaxis: {
            ...miseEnPagePlotly.xaxis,
            title: 'Tempo (BPM - Battements par minute)',
            range: [60, 220]
        },
        yaxis: {
            ...miseEnPagePlotly.yaxis,
            title: 'Nombre de titres'
        }
    };

    
    Plotly.newPlot('histogramme-bpm', [trace], layout, configPlotly);
    
    Plotly.animate('histogramme-bpm', {
        data: [trace],
        layout: layout
    }, {
        transition: {
            duration: 1000,
            easing: 'cubic-in-out'
        },
        frame: {
            duration: 1000
        }
    });
}






/*GRAPHIQUE 2: Graphique Chaleur  */


function creerGraphiqueChaleur(donnees) {
    const trace = {
        x: donnees.map(d => d.dansabilite),
        y: donnees.map(d => d.valence),
        type: 'histogram2d',
        
        nbinsx: 20,
        nbinsy: 20,
        colorscale: [
            [0, '#121212'],      
            [0.2, '#00441b'],    
            [0.5, '#1DB954'],    
            [1, '#1ed760']       
        ],
        showscale: true,
        colorbar: {
            title: 'Concentration',
            titlefont: { color: '#b3b3b3' },
            tickfont: { color: '#b3b3b3' },
            thickness: 10
        }
    };

    const layout = {
        ...miseEnPagePlotly,
        xaxis: { 
            title: 'DANSABILITÉ (%)', 
            range: [20, 100], 
            gridcolor: '#282828',
            zeroline: false 
        },
        yaxis: { 
            title: 'VALENCE (POSITIVITÉ) (%)', 
            range: [0, 100], 
            gridcolor: '#282828',
            zeroline: false 
        },
        // On ajoute une annotation pour expliquer le "pic"
        annotations: [{
            x: 75, y: 75,
            text: "LE CŒUR DES HITS",
            showarrow: true,
            arrowhead: 2,
            arrowcolor: '#ffffff',
            ax: 40, ay: -40,
            font: { color: '#ffffff', weight: 'bold', size: 12 },
            bgcolor: 'rgba(29, 185, 84, 0.8)'
        }]
    };

    Plotly.newPlot('graphique-dispersion', [trace], layout, configPlotly);
}









/* GRAPHIQUE 3: TOP 10 ARTISTES Barres horizontales*/


function creerBarresArtistes(donnees) {
    
    const compteArtistes = {};
    donnees.forEach(item => {
        const artiste = item.nom_artiste.split(',')[0].trim();
        if (artiste) {
            compteArtistes[artiste] = (compteArtistes[artiste] || 0) + 1;
        }
    });

    // Trier prendre le Top 10
    const top10 = Object.entries(compteArtistes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .reverse(); 

    const trace = {
        y: top10.map(a => a[0]), // Noms artistes
        x: top10.map(a => a[1]), // Nombre de titres
        type: 'bar',
        orientation: 'h', 
        marker: {
            color: top10.map((_, i) => {
                
                const intensite = 0.5 + (i / 10) * 0.5;
                return `rgba(29, 185, 84, ${intensite})`;
            }),
            line: {
                color: spotifyVertEclat,
                width: 1.5
            }
        },
        hovertemplate: '<b>%{y}</b><br><b>%{x} titres</b> dans le top<extra></extra>'
    };

    const layout = {
        ...miseEnPagePlotly,
        xaxis: {
            ...miseEnPagePlotly.xaxis,
            title: 'Nombre de titres dans le dataset'
        },
        yaxis: {
            ...miseEnPagePlotly.yaxis,
            title: '',
            tickfont: { size: 12 },
            automargin: true 
        },
        margin: { ...miseEnPagePlotly.margin, l: 140 }
    };

  
    Plotly.newPlot('barres-artistes', [trace], layout, configPlotly);
    
    Plotly.animate('barres-artistes', {
        data: [trace],
        layout: layout
    }, {
        transition: {
            duration: 1200,
            easing: 'elastic-out' 
        },
        frame: {
            duration: 1200
        }
    });
}














/* GRAPHIQUE 4: Graphique Miroir Acoustique Contre Numérique*/




    function creerGraphiqueMiroir(donnees) {
    const nb = donnees.length;
    

    let sommeAcoustique = donnees.reduce((s, d) => s + (parseFloat(d.acousticness) || 0), 0);
    let sommeEnergie = donnees.reduce((s, d) => s + (parseFloat(d.energie) || 0), 0);

    

    let moyAcoustiqueBrute = (sommeAcoustique / nb) * 100;
    let moyEnergieBrute = (sommeEnergie / nb) * 100;

    
    const total = moyAcoustiqueBrute + moyEnergieBrute;
    const moyAcoustique = Math.round((moyAcoustiqueBrute / total) * 100);
    const moyEnergie = Math.round((moyEnergieBrute / total) * 100);


    
    

    const traceAcoustique = {
        x: [-moyAcoustique],
        y: ['Moyenne des Hits'],
        name: 'Texture Acoustique',
        type: 'bar',
        orientation: 'h',
        marker: { 
            color: '#ffffff',
            line: { color: '#ffffff', width: 1 }
        },
        // AJOUT DES ÉCRITURES
        text: [moyAcoustique + '%'],
        textposition: 'inside',
        insidetextanchor: 'middle',
        textfont: { color: '#000000', size: 18, family: 'Montserrat', weight: 900 },
        // CORRECTION : On affiche moyAcoustique en positif sans décimales
        customdata: [moyAcoustique],
        hovertemplate: 'Acoustique: %{customdata}%<extra></extra>'
    };

    const traceEnergie = {
        x: [moyEnergie],
        y: ['Moyenne des Hits'],
        name: 'Puissance Numérique',
        type: 'bar',
        orientation: 'h',
        marker: { 
            color: '#1DB954',
            line: { color: '#1ed760', width: 1 }
        },

        // AJOUT DES ÉCRITURES
        text: [moyEnergie + '%'],
        textposition: 'inside',
        insidetextanchor: 'middle',
        textfont: { color: '#ffffff', size: 18, family: 'Montserrat', weight: 900 },

        // CORRECTION : On affiche moyEnergie arrondi sans décimales
        customdata: [moyEnergie],
        hovertemplate: 'Énergie: %{customdata}%<extra></extra>'
    };

    const layout = {
        ...miseEnPagePlotly,
        barmode: 'relative',
        xaxis: {
            title: 'Dominance de la production',
            gridcolor: '#282828',

            // Simplification de l'axe 
            tickvals: [-100, 0, 100],
            ticktext: ['100% Acoustique', 'Équilibre', '100% Numérique'],
            range: [-110, 110],
            zeroline: true,
            zerolinecolor: '#ffffff'
        },
        yaxis: { visible: false },
        margin: { t: 50, r: 50, b: 80, l: 50 },
        showlegend: true,
        legend: { 
            x: 0.5, 
            y: -0.4, 
            xanchor: 'center', 
            orientation: 'h', 
            font: { color: '#ffffff', size: 12 } 
        }
    };

    Plotly.newPlot('graphique-miroir-adn', [traceAcoustique, traceEnergie], layout, configPlotly);
}



/* Lancement au chargement de la page*/

document.addEventListener('DOMContentLoaded', initialiserRevelationDefilement);