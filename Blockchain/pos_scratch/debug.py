from Transaction import TransType
from Wallet import Wallet
from TransactionPool import TransactionPool
from Blockchain import Blockchain
from AccountModel import AccountModel

from pprint import pprint




if __name__ == '__main__':

    admin_wallet = Wallet()
    alice_wallet = Wallet()
    bob_wallet = Wallet()
    account_model = AccountModel()
    pool = TransactionPool(account_model=account_model)
    blockchain = Blockchain(pool=pool)


    transaction = admin_wallet.create_transaction(
        receiver=alice_wallet.public_key_string,
        amount=250,
        trans_type=TransType.EXCHANGE.value
    )

    pool.add_transaction(transaction=transaction)




    if pool.transactions:
        prev_hash = blockchain.get_last_block_hash()
        block_count = blockchain.get_last_block_count()

        block = bob_wallet.create_block(
            transactions=pool.transactions.copy(),
            prev_hash=prev_hash,
            block_count=block_count+1
        )



        blockchain.add_block(block)


        transaction = alice_wallet.create_transaction(
            receiver=bob_wallet.public_key_string,
            amount=100,
            trans_type=TransType.TRANSFER.value
        )


        trans_transfer = pool.add_transaction(transaction=transaction)

        prev_hash = blockchain.get_last_block_hash()
        block_count = blockchain.get_last_block_count()

        block = bob_wallet.create_block(
            transactions=pool.transactions.copy(),
            prev_hash=prev_hash,
            block_count=block_count+1,
            forger='forger'
        )



        blockchain.add_block(block)



    pprint(blockchain.get_blockchain())

    #####################################################################################################


