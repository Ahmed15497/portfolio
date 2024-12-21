

class AccountModel():

    def __init__(self, public_key_string=None, initial_balance=0):
        self.balances = {}
        if public_key_string:
            self.update_balance(public_key_string, initial_balance)


    def __is_account_exist(self, public_key_string):
        return public_key_string in self.balances.keys()

    def add_account(self, public_key_string):
        if not(self.__is_account_exist(public_key_string)):
            self.balances[public_key_string] = 0

    def get_balance(self, public_key_string):
        return self.balances.get(public_key_string, 0)
    
    def update_balance(self, public_key_string, amount):
        self.balances[public_key_string] = self.balances.get(public_key_string, 0) + amount 

    def is_amount_covered(self, public_key_string, amount):
        return self.balances.get(public_key_string, 0) >= amount
    
    def get_balances(self):
        return self.balances

    
