from clients.corona import Client as CoronaClient
from clients.helios import Client as HeliosClient
from clients.hue import Client as HueClient
from clients.motd import Client as MotdClient
from clients.openweather import Client as OpenWeatherClient
from clients.pv import Client as PVClient
from clients.pvsums import Client as PVSumsClient
from clients.rss import Client as RSSClient
from clients.tado import Client as TadoClient
from clients.vicare import Client as ViCareClient
from clients.wifi import Client as WifiClient
from sma_daemon import MyDaemon
from sqlalchemy import create_engine
import argparse
import asyncio
import json
import logging
import model
import websockets

logging.basicConfig(level=logging.WARN)
logging.getLogger().setLevel(logging.WARN)
log = logging.getLogger(__name__)


def parse_arguments():
    parser = argparse.ArgumentParser(
        description='Dashboard wehrmann.it'
    )
    parser.add_argument(
        '-c',
        dest='config',
        default='/etc/smaemd/config',
        help='Specify the config file. (default: /etc/smaemd/config)',
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_arguments()
    smadaemon = MyDaemon(args.config)
    smadaemon.config.engine = smadaemon.config.get('DB', 'connect')
    if smadaemon.config.engine:
        smadaemon.config.engine = create_engine(smadaemon.config.engine)
        model.Base.metadata.create_all(smadaemon.config.engine)

    clients = dict(
        pvclient=PVClient(smadaemon),
        pvsumsclient=PVSumsClient(smadaemon.config),
        openweatherclient=OpenWeatherClient(smadaemon.config),
        coronaclient=CoronaClient(smadaemon.config),
        heliosclient=HeliosClient(smadaemon.config),
        rssclient=RSSClient(smadaemon.config),
        motdclient=MotdClient(smadaemon.config),
        wificlient=WifiClient(smadaemon.config),
        hueclient=HueClient(smadaemon.config),
        tadoclient=TadoClient(smadaemon.config),
        vicareclient=ViCareClient(smadaemon.config),
    )

    async def server(websocket, path):
        for client in clients.values():
            if client.enabled:
                await client.register(websocket)

        while True:
            # Get received data from websocket
            data = await websocket.recv()
            if data:
                data = json.loads(data)
                for key, value in data.items():
                    try:
                        await clients[f'{key}client'].set_status(value)
                    except Exception as e:
                        log.error(f'Exception while setting {key}: {e}')
            await asyncio.sleep(1)

    tasks = [
        websockets.serve(server, "localhost", 6790),
    ]
    tasks.extend(
        [c.run() for c in clients.values() if c.enabled]
    )

    asyncio.get_event_loop().run_until_complete(asyncio.wait(tasks))
    asyncio.get_event_loop().run_forever()
