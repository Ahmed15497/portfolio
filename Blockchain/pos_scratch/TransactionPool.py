from AccountModel import AccountModel
from ProofOfStake import ProofOfStake
from Transaction import Transaction, TransType
from Wallet import Wallet

class TransactionPool():

    def __init__(self, account_model:AccountModel, proof_of_stake:ProofOfStake):
        self.transactions = set()
        self.account_model = account_model
        self.proof_of_stake = proof_of_stake


    def add_transaction(self, transaction: Transaction):
        # Check if the transaction is already in the pool
        if not(transaction in self.transactions):

            if transaction.trans_type == TransType.EXCHANGE.value:
                self.transactions.add(transaction)
                #self.account_model.update_balance(transaction.receiver_public_key, transaction.amount)

            elif (transaction.trans_type == TransType.TRANSFER.value) and (self.__transaction_validation(transaction)):            
                self.transactions.add(transaction)
                self.account_model.update_balance(transaction.sender_public_key, -transaction.amount)

            elif (transaction.trans_type == TransType.STAKE.value) and (self.__transaction_validation(transaction)):
                if transaction.sender_public_key == transaction.receiver_public_key:
                    self.transactions.add(transaction)
                    self.account_model.update_balance(transaction.sender_public_key, -transaction.amount)

            elif (transaction.trans_type == TransType.RELEASE.value) and (self.__transaction_validation(transaction)):
                if transaction.sender_public_key == transaction.receiver_public_key:
                    self.transactions.add(transaction)
                    self.proof_of_stake.update_balance(transaction.sender_public_key, -transaction.amount)


            return transaction         

    def undo_transaction(self, transaction:Transaction):
        self.transactions.discard(transaction)
        if transaction.trans_type == TransType.RELEASE.value:
            self.proof_of_stake.update_balance(transaction.sender_public_key, transaction.amount)
        else:
            self.account_model.update_balance(transaction.sender_public_key, transaction.amount)

    def remove_transaction(self, transaction:Transaction):
        if transaction.trans_type == TransType.STAKE.value:
            self.proof_of_stake.update_balance(transaction.receiver_public_key, transaction.amount)
        else:
            self.account_model.update_balance(transaction.receiver_public_key, transaction.amount)

        self.transactions.discard(transaction)

    def is_forger_required(self):
        if len(self.transactions) >= 1:
            return True 
        else:
            return False

        

    def clear_pool(self):
        self.transactions = set()


    def is_valid_covered_transactions(self, transactions):
        result = True 
        for transaction in transactions:
            if transaction in self.transactions:
                is_covered_transaction = True 
            else:
                is_covered_transaction = self.__transaction_validation(transaction)

            is_valid_transaction = Wallet.is_valid_signature(
                data=transaction.payload(),
                signature=transaction.signature,
                public_key_string=transaction.sender_public_key
            )

            result = result and is_covered_transaction and is_valid_transaction
            if result == False:
                break

        return result
    

    def update_account_stake_models(self, transactions):
        for transaction in transactions:
            self.__update_account_stake_models(transaction=transaction)


    def __update_account_stake_models(self, transaction:Transaction):
        if transaction.trans_type == TransType.RELEASE.value:
            self.proof_of_stake.update_balance(transaction.sender_public_key, -transaction.amount)
        else:
            self.account_model.update_balance(transaction.sender_public_key, -transaction.amount)
        
 
           

         


    

    def __transaction_validation(self, transaction:Transaction):
        if transaction.trans_type == TransType.RELEASE.value:
            return self.__release_validation(transaction=transaction)
        elif transaction.trans_type == TransType.EXCHANGE.value:
            return True  
        else:
            return self.__transfer_validation(transaction=transaction)
 

    def __transfer_validation(self, transaction:Transaction):
        # check if the sender has enough balance            
        return self.account_model.is_amount_covered(transaction.sender_public_key, transaction.amount)
    
    def __release_validation(self, transaction:Transaction):
        # check if the sender has enough balance    
        return self.proof_of_stake.is_amount_covered(transaction.sender_public_key, transaction.amount)        

    
    def get_balances(self):
        return self.account_model.get_balances()
    
    def get_transactions(self):
        return {key:value.to_json() for key, value in enumerate(self.transactions)}



    