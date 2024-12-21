import time



class Block():

    def __init__(self,
                 transactions,
                 prev_hash,
                 forger,
                 block_count):
        
        self.transactions = transactions
        self.prev_hash = prev_hash
        self.forger = forger
        self.block_count = block_count
        self.timestamp = time.time()
        self.__signature = ''

    @property
    def signature(self):
        return self.__signature

    @signature.setter
    def signature(self, signature):
        self.__signature = signature

    @staticmethod
    def genesis():

        genesis_block = Block(
            transactions=[],
            prev_hash='genesis_hash',
            forger='genesis',
            block_count=0
        )


        genesis_block.timestamp = 0


        return genesis_block


    def to_json(self):
        block_json = self.__dict__.copy()
        block_json['transactions'] = list(map(lambda x: x.to_json(), block_json['transactions']))
        return block_json
    
    def payload(self):
        block_json = self.to_json()
        return {k: v for k, v in block_json.items() if not k.startswith('_')}
    

        