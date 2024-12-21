from pprint import pprint
from Node import Node 
import argparse 
from NodeAPI import NodeAPI





if __name__ == '__main__':

    parser = argparse.ArgumentParser()
    parser.add_argument('-ho', '--host', default='localhost')
    parser.add_argument('-ps', '--port_socket', type=int, required=True)
    parser.add_argument('-pa', '--port_api', type=int, required=True)

    args = parser.parse_args()
    host = args.host
    port_socket = args.port_socket
    port_api = args.port_api


    node = Node(host=host, port=port_socket)
    node.start_p2p()

    api = NodeAPI(node, port=port_api)
    api.start()


    #if port_socket != 8050:
    #    node.p2p.connect_with_node('localhost', 8050)



    

