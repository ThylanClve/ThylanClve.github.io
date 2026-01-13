/*
CONFIGURATION PLOTLY 
*/

const plotlyConfig = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d']
};

const plotlyLayout = {
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


const spotifyGreen = '#1DB954';
const spotifyGreenLight = '#1ed760';





/*
UTILITAIRES
*/


function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
}

/**
 * @param {string} elementId - 
 * @param {number|string} targetValue - 
 * @param {number} duration - 
 */
function animateCounter(elementId, targetValue, duration = 2000) {
    const element = document.getElementById(elementId);
    if (!element || !targetValue) return;
    
   
    if (typeof targetValue === 'number') {
        let startValue = 0;
        const increment = targetValue / (duration / 16); // 
        
        const counter = setInterval(() => {
            startValue += increment;
            if (startValue >= targetValue) {
                element.textContent = Math.round(targetValue);
                clearInterval(counter);
            } else {
                element.textContent = Math.round(startValue);
            }
        }, 16);
    } else {
       
        element.style.opacity = '0';
        setTimeout(() => {
            element.textContent = targetValue;
            element.style.transition = 'opacity 0.8s ease-in';
            element.style.opacity = '1';
        }, 300);
    }
}






/*
SCROLL REVEAL (Animation au défilement)
*/


function setupScrollReveal() {
    const reveals = document.querySelectorAll('.scroll-reveal');
    
    const revealOnScroll = () => {
        reveals.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            
            if (elementTop < windowHeight * 0.8) {
                element.classList.add('visible');
            }
        });
    };
    
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); 
}





/*
CHARGEMENT ET NETTOYAGE DES DONNÉES
*/


 
Papa.parse('most_streamed_spotify-2023.csv', {
    download: true,
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, 
    complete: function(results) {
        const data = results.data;
        console.log('📊 Données brutes chargées:', data.length, 'lignes');




        
/*
NETTOYAGE DES DONNÉES (Version sécurisée anti-bug)
*/
const cleanData = data.map(row => {
   
    let streamsRaw = String(row['streams'] || '').trim();
    
    
    streamsRaw = streamsRaw.replace(/[^0-9]/g, ''); 
    
    
    const streams = parseInt(streamsRaw) || 0;
    
    return {
        track_name: String(row['track_name'] || '').trim(),
        artist_name: String(row['artist(s)_name'] || '').trim(),
        streams: streams,
        bpm: parseInt(row['bpm']) || 0,
        danceability: parseInt(row['danceability_%']) || 0,
        valence: parseInt(row['valence_%']) || 0,
        energy: parseInt(row['energy_%']) || 0
    };
}).filter(row => {
    // SÉCURITÉ : On garde la ligne seulement si :
    // - Le BPM est valide (> 0)
    // - Le titre n'est pas vide
    // - Les streams sont > 0 ET inférieurs à 4 milliards (Record du monde actuel)
    return row.bpm > 0 && 
           row.track_name.length > 0 && 
           row.streams > 0 && 
           row.streams < 4000000000; 
});



/*
GÉNÉRATION DES VISUALISATIONS
*/
        
        
        calculateKPIs(cleanData);

        
        setTimeout(() => createBPMHistogram(cleanData), 400);
        setTimeout(() => createScatterPlot(cleanData), 600);
        setTimeout(() => createArtistsBar(cleanData), 800);
        
       
        setupScrollReveal();
    },
    error: function(error) {
        console.error('❌ Erreur de chargement du CSV:', error);
        document.getElementById('kpi-top-track').textContent = 'Erreur de chargement des données';
    }
});





/*
CALCUL DES KPIs (avec animation)
*/


function calculateKPIs(data) {
    
    //KPI 1: Titre Champion 
    const topTrack = data.reduce((max, item) => 
        item.streams > max.streams ? item : max, data[0]);
    
    animateCounter('kpi-top-track', topTrack.track_name, 1500);
    setTimeout(() => {
        document.getElementById('kpi-top-track-streams').textContent = 
            formatNumber(topTrack.streams) + ' streams';
    }, 1500);

    //KPI 2: BPM Moyen 
    const avgBPM = Math.round(
        data.reduce((sum, item) => sum + item.bpm, 0) / data.length
    );
    animateCounter('kpi-avg-bpm', avgBPM, 2000);

    
    const artistCounts = {};
    data.forEach(item => {
        
        const artist = item.artist_name.split(',')[0].trim();
        artistCounts[artist] = (artistCounts[artist] || 0) + 1;
    });
    
    
    const topArtist = Object.entries(artistCounts)
        .sort((a, b) => b[1] - a[1])[0];
    
    animateCounter('kpi-top-artist', topArtist[0], 1800);
    setTimeout(() => {
        document.getElementById('kpi-top-artist-count').textContent = 
            topArtist[1] + ' titres dans le top';
    }, 1800);
}






/*
GRAPHIQUE 1: HISTOGRAMME BPM
*/


function createBPMHistogram(data) {
    const bpmValues = data.map(d => d.bpm);

    const trace = {
        x: bpmValues,
        type: 'histogram',
        marker: {
            color: spotifyGreen,
            line: {
                color: spotifyGreenLight,
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
        ...plotlyLayout,
        xaxis: {
            ...plotlyLayout.xaxis,
            title: 'Tempo (BPM - Battements par minute)',
            range: [60, 220]
        },
        yaxis: {
            ...plotlyLayout.yaxis,
            title: 'Nombre de titres'
        }
    };

   
    Plotly.newPlot('bpm-histogram', [trace], layout, plotlyConfig);
    
    
    Plotly.animate('bpm-histogram', {
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







/*
GRAPHIQUE 2: SCATTER PLOT (Danceability vs Valence)
*/


function createScatterPlot(data) {
    
    
    const maxStreams = Math.max(...data.map(d => d.streams));
    const minSize = 6;
    const maxSize = 35;

    const trace = {
        x: data.map(d => d.danceability),
        y: data.map(d => d.valence),
        mode: 'markers',
        type: 'scatter',
        marker: {
            
            size: data.map(d => minSize + (d.streams / maxStreams) * (maxSize - minSize)),
            
            color: data.map(d => d.energy),
            colorscale: [
                [0, '#1a1a1a'],      
                [0.5, spotifyGreen],  
                [1, spotifyGreenLight] 
            ],
            opacity: 0.75,
            line: {
                color: 'rgba(255,255,255,0.3)',
                width: 1
            },
            colorbar: {
                title: 'Énergie (%)',
                tickfont: { color: '#b3b3b3' },
                titlefont: { color: '#b3b3b3' },
                thickness: 15,
                len: 0.7
            }
        },
        text: data.map(d => `<b>${d.track_name}</b><br>${d.artist_name}`),
        hovertemplate: 
            '%{text}<br>' +
            '<b>Danceability:</b> %{x}%<br>' +
            '<b>Valence:</b> %{y}%<br>' +
            '<extra></extra>'
    };

    const layout = {
        ...plotlyLayout,
        xaxis: {
            ...plotlyLayout.xaxis,
            title: 'Danceability (capacité à danser, en %)',
            range: [0, 100]
        },
        yaxis: {
            ...plotlyLayout.yaxis,
            title: 'Valence / Positivité musicale (en %)',
            range: [0, 100]
        }
    };

    
    Plotly.newPlot('scatter-plot', [trace], layout, plotlyConfig);
}








/* 
GRAPHIQUE 3: TOP 10 ARTISTES (Barres horizontales)
*/


function createArtistsBar(data) {
    
    
    const artistCounts = {};
    data.forEach(item => {
      
        const artist = item.artist_name.split(',')[0].trim();
        if (artist) {
            artistCounts[artist] = (artistCounts[artist] || 0) + 1;
        }
    });

   
    const top10 = Object.entries(artistCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .reverse(); 

    const trace = {
        y: top10.map(a => a[0]), 
        x: top10.map(a => a[1]), 
        type: 'bar',
        orientation: 'h', 
        marker: {
            
            color: top10.map((_, i) => {
                const intensity = 0.5 + (i / 10) * 0.5;
                return `rgba(29, 185, 84, ${intensity})`;
            }),
            line: {
                color: spotifyGreenLight,
                width: 1.5
            }
        },
        hovertemplate: '<b>%{y}</b><br><b>%{x} titres</b> dans le top<extra></extra>'
    };

    const layout = {
        ...plotlyLayout,
        xaxis: {
            ...plotlyLayout.xaxis,
            title: 'Nombre de titres dans le dataset'
        },
        yaxis: {
            ...plotlyLayout.yaxis,
            title: '',
            tickfont: { size: 12 },
            automargin: true 
        },
        margin: { ...plotlyLayout.margin, l: 140 }
    };



// Créer le graphique
    Plotly.newPlot('artists-bar', [trace], layout, plotlyConfig);
    
   
    Plotly.animate('artists-bar', {
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






document.addEventListener('DOMContentLoaded', setupScrollReveal);