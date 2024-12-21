from Crypto.PublicKey import RSA
from Crypto.Signature import PKCS1_v1_5
from BlockchainUtils import BlockchainUtils
from Transaction import Transaction, TransType
from Block import Block
import os


class Wallet():

    def __init__(self, path=None):
        """
        Initializes the Wallet instance.
        If `path` is None, generates a new RSA keypair.
        If `path` is provided, attempts to load the keypair from the specified file.

        :param path: Path to the file containing the RSA keypair. If None, a new keypair is generated.
        """
        if path and os.path.exists(path):
            with open(path, 'rb') as file:
                self.__keypair = RSA.import_key(file.read())
        else:
            self.__keypair = RSA.generate(2048)

    def save_keypair(self, path):
        """
        Saves the RSA keypair to the specified file path.

        :param path: Path to the file where the keypair will be saved.
        """
        with open(path, 'wb') as file:
            file.write(self.__keypair.export_key())


    @property
    def public_key_string(self):
        return self.__keypair.publickey().exportKey('PEM').decode()

    def sign(self, data):
        data_hash = BlockchainUtils.hash(data)
        signature_scheme_object = PKCS1_v1_5.new(self.__keypair)
        signature = signature_scheme_object.sign(data_hash)
        return signature.hex()
    
    @staticmethod
    def is_valid_signature(data, signature, public_key_string):
        signature = bytes.fromhex(signature)
        data_hash = BlockchainUtils.hash(data)
        public_key = RSA.importKey(public_key_string)
        signature_scheme_object = PKCS1_v1_5.new(public_key)
        valid_signature = signature_scheme_object.verify(data_hash, signature)
        return valid_signature
    
    def create_transaction(self, sender, receiver, amount, trans_type):

        #if not(sender):
        transaction = Transaction(
            sender_public_key=sender,
            receiver_public_key=receiver,
            amount=amount,
            trans_type=trans_type
        )

        signature = self.sign(
                transaction.payload()
            )

        transaction.signature = signature


        return transaction
    
    def create_block(self, transactions, prev_hash, block_count, forger):

        block = Block(
            transactions=transactions,
            prev_hash=prev_hash,
            forger=forger,
            block_count=block_count
        )

        signature = self.sign(
            block.payload()
        )
        block.signature = signature

        return block


