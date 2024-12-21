from enum import Enum
from uuid import uuid4
import time 



class TransType(Enum):
    TRANSFER = 'TRANSFER'
    EXCHANGE = 'EXCHANGE'
    STAKE = 'STAKE'
    RELEASE = 'RELEASE'

class Transaction:

    def __init__(self, sender_public_key, receiver_public_key, amount, trans_type):
        self.sender_public_key = sender_public_key
        self.receiver_public_key = receiver_public_key
        self.amount = amount 
        self.trans_type = trans_type
        self.id = uuid4().hex
        self.timestamp = time.time()
        self.__signature = ''

    @property
    def signature(self):
        return self.__signature

    @signature.setter
    def signature(self, signature):
        self.__signature = signature

    def to_json(self):
        return self.__dict__
    
    def payload(self):
        return {k: v for k, v in self.__dict__.copy().items() if not k.startswith('_')}
    
    def __eq__(self, other):
        if not isinstance(other, Transaction):
            return NotImplemented
        return self.id == other.id
    
    def __hash__(self):
        # Hash based on the id to use in a set
        return hash(self.id)