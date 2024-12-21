from p2pnetwork.node import Node 
from SocketConnector import SocketConnector
from Message import Message, MessageType
from BlockchainUtils import BlockchainUtils
from TransactionPool import TransactionPool
from Wallet import Wallet
from ProofOfStake import ProofOfStake
from Blockchain import Blockchain
from Wallet import Wallet
import json
import threading
import time 



class SocketCommunication(Node):

    def __init__(self, host:str, port:int, pool:TransactionPool, proof_of_stake:ProofOfStake, blockchain:Blockchain, wallet:Wallet):
        super(SocketCommunication, self).__init__(host, port)
        self.socket_connector = SocketConnector(host=host, port=port)
        self.pool = pool
        self.peers = set()
        self.seeders = set()
        self.message_ids = set()
        self.proof_of_stake = proof_of_stake
        self.seeders.add(SocketConnector(host='localhost', port=8050))
        self.blockchain = blockchain
        self.wallet = wallet
        




    def connect_to_seeders(self):
        if self.socket_connector not in self.seeders:
            for seeder in self.seeders:
                print(f'connecting to seeder: {seeder.host} {seeder.port}')
                self.connect_with_node(seeder.host, seeder.port)

        

    def dicovery(self):
        while True:
            print('discovery ...')
            message = Message(self.socket_connector, MessageType.DISCOVERY.value, self.peers)
            self.broadcast(message)
            time.sleep(10)    

    def status(self):
        while True:
            print('status ...')
            print(self.peers)
            time.sleep(10)

    def start_discovery(self):
        status_thread = threading.Thread(target=self.status, args=())
        status_thread.start()
        discovery_thread = threading.Thread(target=self.dicovery, args=())
        discovery_thread.start()   
    


    def start(self):
        super(SocketCommunication, self).start()
        #PeerDiscoveryHandler.start(self)
        self.start_discovery() 
        self.connect_to_seeders()  

    def start_socket_communication(self):
        self.start()

    def inbound_node_connected(self, node):
        super(SocketCommunication, self).inbound_node_connected(node)
        self.handshake(node)
    
    def outbound_node_connected(self, node):
        super(SocketCommunication, self).inbound_node_connected(node)
        self.handshake(node)



    def node_message(self, node, data):
        #super(SocketCommunication, self).node_message(node, data)
        message = BlockchainUtils.decode(json.dumps(data))
        self.handle_message(node, message)


    def handle_message(self, node, message:Message):


        if message.id in self.message_ids:
            # duplicated message
            return
        
        # adding the message id to the set
        self.message_ids.add(message.id)

        if message.message_type == MessageType.DISCOVERY.value:
            # discovery message
            sender_connector = message.sender_connector
            peers = message.data
            # add the sender to the list of peers
            peers.add(sender_connector)
            # remove the self peer from the sent peers if exists
            peers.discard(self.socket_connector)
            # get the difference between the peers
            diff_peers = peers.difference(self.peers)
            # add the unknown peers to the known ones
            self.peers = self.peers.union(diff_peers)
            # iterate over the unknown peers to connect with them
            for peer in diff_peers:
                self.connect_with_node(peer.host, peer.port)

            ## synchronize the blockchain
            # validate blockchain if the proposed blockchain is longer than the node
            # update blockchain to the longest one
            # update account model
            # update proof_of_stake
            





        elif message.message_type == MessageType.TRANSACTION.value:
            transaction = message.data
            # to-do validate incoming transaction
            is_valid_transaction = Wallet.is_valid_signature(data=transaction.payload(), signature=transaction.signature, public_key_string=transaction.sender_public_key)
            if is_valid_transaction:
                # add the transaction to the transaction pool of the node
                self.pool.add_transaction(transaction=transaction)
                self.forger_handler()

        elif message.message_type == MessageType.BLOCKREQUEST.value:
            block = message.data
            forger = block.forger
            prev_hash = block.prev_hash
            block_count = block.block_count
            transactions = block.transactions
            block_signature = block.signature
            total_validation = True
            # verify the forger
            # if proof_of_stake is empty, then approve this forger else run get winner staker
            is_valid_forger = self.__verify_forger(claimed_forger=forger)
            total_validation = total_validation and is_valid_forger
            #print(total_validation)
            # verify the lasthash
            is_valid_prev_hash = (prev_hash == self.blockchain.get_last_block_hash())
            total_validation = total_validation and is_valid_prev_hash
            #print(total_validation)
            # verify block count
            is_valid_block_count = (block_count == (self.blockchain.get_last_block_count() + 1))
            if is_valid_block_count == False:
                # we need to synchronize the chain
                self.__request_chain()

            total_validation = total_validation and is_valid_block_count
            #print(total_validation)
            # verify the transactions signatures and coverage
            is_valid_covered_transactions = self.pool.is_valid_covered_transactions(transactions)
            total_validation = total_validation and is_valid_covered_transactions
            #print(total_validation)
            # verify block signature
            is_valid_block = self.wallet.is_valid_signature(block.payload(), block_signature, forger)
            total_validation = total_validation and is_valid_block
            #print(total_validation)
            if total_validation:             
                # update account and stake models based on the transactions
                self.pool.update_account_stake_models(transactions)
                # add the block to the blockchain
                self.blockchain.add_block(block)

        elif message.message_type == MessageType.BLOCKRESPONSE.value:
            # if the majority approves then add the proposed block to my chain
            # else undo the transactions 
            pass 
       

        elif message.message_type == MessageType.BLOCKCHAINREQUEST.value:
            message = Message(self.socket_connector, MessageType.BLOCKCHAINRESPONSE.value, self.blockchain)
            encoded_message = BlockchainUtils.encode(message)
            self.send_to_node(node, encoded_message)

        elif message.message_type == MessageType.BLOCKCHAINRESPONSE.value:
            # implement blockchain response
            # make the longest chain win
            # validate on all the chain
            # if valid then update the account and stake models
            pass 

        


        




    def __request_chain(self):
        message = Message(self.socket_connector, MessageType.BLOCKCHAINREQUEST.value, None)
        encoded_message = BlockchainUtils.encode(message)
        self.broadcast(encoded_message)


            

    def __verify_forger(self, claimed_forger):
        if len(self.proof_of_stake.balances) == 0:
            return True 
        else:
            winner_staker = self.proof_of_stake.get_winner_staker(seed=self.blockchain.get_last_block_hash())
            if claimed_forger == winner_staker:
                return True 
            else:
                return False




            




    def handshake(self, node):
        encoded_handshake_message = self.handshake_message()
        self.send_to_node(node, encoded_handshake_message)


    def handshake_message(self):
        MESSAGE_TYPE = MessageType.DISCOVERY.value
        message = Message(self.socket_connector, MESSAGE_TYPE, self.peers)
        encoded_message = BlockchainUtils.encode(message)
        return encoded_message
    

    def transaction_broadcast(self, transaction):
        MESSAGE_TYPE = MessageType.TRANSACTION.value
        message = Message(self.socket_connector, MESSAGE_TYPE, transaction)
        encoded_message = BlockchainUtils.encode(message)
        self.forger_handler()
        self.broadcast(encoded_message)
        

      




    def broadcast(self, message):
        self.send_to_nodes(message)


    def forger_handler(self):
        is_forger_required = self.pool.is_forger_required()
        if is_forger_required:
            winner_staker = self.proof_of_stake.get_winner_staker(seed=self.blockchain.get_last_block_hash())
            #print(f'Winner staker: {winner_staker}')
            if winner_staker == self.wallet.public_key_string:
                # It is me the next forger
                #print('It is me the next forger')

                self.forger_work()


                pass 
            else:
                # someone else is the next forger
                #print('Someone else is the next forger')
                pass 

    def forger_work(self):

        block = self.wallet.create_block(
            transactions=self.pool.transactions.copy(),
            prev_hash=self.blockchain.get_last_block_hash(),
            block_count=self.blockchain.get_last_block_count()+1,
            forger=self.wallet.public_key_string
            )
        
        pass 
        # do not add the block until the majority approves
        ################################################################
        self.blockchain.add_block(block=block)
        ###################################################################

        # send the block to other nodes
        message = Message(
            self.socket_connector,
            MessageType.BLOCKREQUEST.value,
            block
        )

        encoded_message = BlockchainUtils.encode(message)
        self.broadcast(message=encoded_message)


        
