<main>
    <h1>Work in progress, API v2 only for now!</h1>
    <br>
    <h2>API v2 Endpoints</h2>
    <br>

    <h3>Cities</h3>
    <ul>
        <li><code>/api/v2/cities</code> – Get a list of all supported cities</li>
    </ul>
    <br>

    <h3>Stations</h3>
    <ul>
        <li><code>/api/v2/cities/[city]/stations</code> – Get all stations in a city</li>
        <li><code>/api/v2/cities/[city]/stations/hash</code> – Get hash value for all stations in a city</li>
    </ul>
    <br>

    <h3>Arrivals</h3>
    <ul>
        <li><code>/api/v2/cities/[city]/stations/[stationId]/arrivals</code> – Get arrivals for a specific station</li>
    </ul>
</main>
