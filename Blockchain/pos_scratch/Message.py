
from enum import Enum
from uuid import uuid4



class MessageType(Enum):
    DISCOVERY = 'DISCOVERY'
    TRANSACTION = 'TRANSACTION'
    BLOCKREQUEST = 'BLOCKREQUEST'
    BLOCKRESPONSE = 'BLOCKRESPONSE'
    BLOCKCHAINREQUEST = 'BLOCKCHAINREQUEST'
    BLOCKCHAINRESPONSE = 'BLOCKCHAINRESPONSE'

class Message():

    def __init__(self, sender_connector, message_type:MessageType, data):
        self.id = uuid4().hex
        self.sender_connector = sender_connector
        self.message_type = message_type
        self.data = data 

    
        