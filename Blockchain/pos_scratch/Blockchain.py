from Block import Block
from BlockchainUtils import BlockchainUtils
from AccountModel import AccountModel
from TransactionPool import TransactionPool

class Blockchain():

    def __init__(self, pool:TransactionPool):
        self.blocks = [Block.genesis()]
        self.pool = pool

    def add_block(self, block:Block):
        if self.__is_block_count_valid(block) and self.__is_block_prev_hash_valid(block):
            self.blocks.append(block)
            # update account model
            for transaction in block.transactions.copy():
                self.pool.remove_transaction(transaction=transaction)

            # Clearing the transaction pool
            #self.pool.clear_pool()



    def to_json(self):
        blockchain_json = self.__dict__.copy()
        blockchain_json['blocks'] = list(map(lambda x: x.to_json(), blockchain_json['blocks']))
        return blockchain_json
    
    def get_blockchain(self):
        return [x.to_json() for x in self.blocks]



    
    def payload(self):
        blockchain_json = self.to_json()
        return {k: v for k, v in blockchain_json.items() if not k.startswith('_')}
    
    def __is_block_count_valid(self, block):
        return self.get_last_block_count() == block.block_count - 1
    
    def __is_block_prev_hash_valid(self, block):
        return self.get_last_block_hash() == block.prev_hash
    
    
    def get_last_block_hash(self):
        return BlockchainUtils.hash(self.blocks[-1].payload()).hexdigest()
    
    def get_last_block_count(self):
        return self.blocks[-1].block_count
    





