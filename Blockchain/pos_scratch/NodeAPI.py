from flask import Flask, request, jsonify
from Node import Node
from BlockchainUtils import BlockchainUtils
from marshmallow import Schema, fields
from marshmallow_enum import EnumField
from Transaction import TransType



class TransactionSchema(Schema):
    sender_public_key = fields.String(required=True)
    receiver_public_key = fields.String(required=True)
    amount = fields.Number(required=True)
    trans_type = EnumField(TransType, required=True)
    signature = fields.String(required=True)



class NodeAPI:
    def __init__(self, node:Node, host='localhost', port=5000):
        """
        Initialize the Flask app with the given host and port.
        :param node: The node object to be used in requests
        :param host: The host for the Flask app
        :param port: The port for the Flask app
        """
        self.node = node
        self.host = host
        self.port = port
        self.app = Flask(__name__)

        # Define routes
        self.setup_routes()

    def setup_routes(self):
        @self.app.route("/")
        def hello_node():
            return "<p>Hello, Node!</p>"

        @self.app.route('/info', methods=['GET'])
        def info():
            return "This is a communication interface to a blockchain node", 200

            
        @self.app.route('/blockchain', methods=['GET'])
        def blockchain():
            return self.node.blockchain.get_blockchain(), 200

        @self.app.route('/transactionPool', methods=['GET'])
        def transactionPool():
            response = jsonify(self.node.pool.get_transactions())
            return response, 200


        @self.app.route('/transaction', methods=['POST'])
        def transaction():
            args = request.get_json()
            #validation =  TransactionSchema().validate(args)
            #if validation:
            #    return jsonify(validation), 401
            
            #transaction = BlockchainUtils.decode(values['transaction'])
            #transaction = values['transaction']
            self.node.add_transaction(issued_transaction=args)
            response = {'Message': 'Received transaction'}
            return jsonify(response)


    def start(self):
        """Run the Flask app."""
        self.app.run(host=self.host, port=self.port)
    






    
        

    

    



    

    