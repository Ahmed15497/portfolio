from Wallet import Wallet
import requests
from Transaction import TransType
from Transaction import Transaction

if __name__ == '__main__':


    NODE_URL = 'http://localhost:5000/'
    alice_wallet = Wallet('localhost_8050_cer')
    bob_wallet = Wallet()
    transaction = dict(
        sender_public_key=alice_wallet.public_key_string,
        receiver_public_key=bob_wallet.public_key_string,
        amount=150,
        trans_type=TransType.EXCHANGE.value
    )

    signature = alice_wallet.sign(
        data=transaction
    )



    kargs = {
        'data':transaction,
        'signature': signature,
        'public_key_string': alice_wallet.public_key_string
    }

    #print(kargs)

    #print(Wallet.is_valid_signature(**kargs))

    transaction['signature'] = signature



    response = requests.post(
        url=NODE_URL+'transaction',
        json=transaction
    )

    print(response.text)
     


