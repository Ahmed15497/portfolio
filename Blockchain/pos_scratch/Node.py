from TransactionPool import TransactionPool
from Wallet import Wallet
from AccountModel import AccountModel
from Blockchain import Blockchain
from SocketCommunication import SocketCommunication
from ProofOfStake import ProofOfStake
 

class Node():

    def __init__(self, host, port):
        self.p2p = None 
        self.host = host 
        self.port = port
        self.wallet = Wallet()
        self.wallet.save_keypair(f"{host}_{port}_cer")
        self.account_model = AccountModel(public_key_string=self.wallet.public_key_string)
        self.proof_of_stake = ProofOfStake(public_key_string=None)
        self.pool = TransactionPool(account_model=self.account_model, proof_of_stake=self.proof_of_stake)
        self.blockchain = Blockchain(pool=self.pool)

    def start_p2p(self):
        self.p2p = SocketCommunication(self.host, self.port, self.pool, self.proof_of_stake, self.blockchain, self.wallet)
        self.p2p.start_socket_communication()
        if self.p2p.socket_connector in self.p2p.seeders:
            # add 1 token for the seeder to guarantee it is the first forger
            self.proof_of_stake.update_balance(self.wallet.public_key_string, 0)
         


    def add_transaction(self, issued_transaction):


        kargs = {
            'data':{k: v for k, v in issued_transaction.items() if k != 'signature'},
            'signature': issued_transaction['signature'],
            'public_key_string': issued_transaction['sender_public_key']
        }

        #print(kargs)

        if (Wallet.is_valid_signature(**kargs)):

            transaction = self.wallet.create_transaction(
                sender=issued_transaction['sender_public_key'],
                receiver=issued_transaction['receiver_public_key'],
                amount=issued_transaction['amount'],
                trans_type=issued_transaction['trans_type'],
            )

            # adding the transaction on the self pool
            self.pool.add_transaction(transaction=transaction)

            # adding the transactions to other nodes
            self.p2p.transaction_broadcast(transaction=transaction)
        









    