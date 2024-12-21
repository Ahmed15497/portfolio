from Crypto.Hash import SHA256
import json
import jsonpickle


class BlockchainUtils():

    @staticmethod
    def hash(data):
        data_string = json.dumps(data)
        data_bytes = data_string.encode()
        data_hash = SHA256.new(data_bytes)
        return data_hash
    
    

    @staticmethod
    def encode(data):
        return jsonpickle.encode(data)
    

    @staticmethod
    def decode(data):
        return jsonpickle.decode(data)