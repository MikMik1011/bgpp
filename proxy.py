import requests
from flask import Flask, request, jsonify, current_app, render_template

app = Flask(__name__)
base_url = 'https://online.bgnaplata.rs/publicapi/v1'
apikey = '1688dc355af72ef09287'

id_uid_map = {}

def populateMap():
    print("Populating map started")
    allStations = getAllStations()
    print('Fetched all stations')

    for city in allStations['stations']:
        id_uid_map[city['station_id']] = city['id']

    print("Populating map finished")

def doRequest(url):
    headers = {
        'X-Api-Authentication': apikey
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as err:
        return jsonify({'error': 'Error sending request', 'message': str(err)}), 500
    
@app.route('/api/stations/<id>', methods=['GET'])
def checkStation(id):
    url = base_url + '/announcement/announcement.php?station_uid=' + str(id_uid_map.get(id) or 0)
    return doRequest(url)

@app.route('/api/stations/all', methods=['GET'])
def getAllStations():
    url = base_url + '/networkextended.php?action=get_cities_extended'
    return doRequest(url)

@app.route('/')
def index():
    return current_app.send_static_file('index.html')

if __name__ == '__main__':
    populateMap()
    app.run(host='0.0.0.0', port=8000)
