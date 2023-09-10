html, body {
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    font-family: 'Montserrat', sans-serif;
}

body {
    display: flex;
    flex-direction: column;
}

#map-wrapper {
    position: relative;
    width: 100%;
}

#map {
    width: 100%;
    height: 100%;
}

a[href^="http://maps.google.com/maps"]{display:none !important}
a[href^="https://maps.google.com/maps"]{display:none !important}

.gmnoprint a, .gmnoprint span, .gm-style-cc {
    display:none;
}
.gmnoprint div {
    background:none !important;
}

#address-form {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f5f5f5;
    padding: 10px;
}

#address-input {
    flex-grow: 1;
    margin-right: 10px;
    padding: 10px;
    border: none;
    border-radius: 30px;
    outline: none;
}

button {
    width: 50px;
    height: 50px;
    border: none;
    border-radius: 10%;
    background-color: #f5f5f5;
    cursor: pointer;
    transition: background-color 0.3s ease;
    display: flex;
    justify-content: center;
    align-items: center;
}

button:hover {
    background-color: #e0e0e0;
}

button img {
    width: 24px;
    height: 24px;
}

@media screen and (max-width: 600px) {
    #address-input {
        width: 80%;
    }
}

* {
    box-sizing: border-box;
}

#directionsPanel {
    max-height: 200px;
    overflow: auto;
}

#recenter-button {
    position: absolute;
    bottom: 10px;
    right: 10px;
    width: 50px;
    z-index: 1;
}

#speedometer {
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 10px;
    background-color: white;
    border-radius: 5px;
    z-index: 1;
}
