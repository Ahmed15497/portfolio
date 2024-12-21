from AccountModel import AccountModel
from Lot import Lot
from BlockchainUtils import BlockchainUtils

class ProofOfStake(AccountModel):

    def __init__(self, public_key_string=None, initial_balance=0):
        super(ProofOfStake, self).__init__(public_key_string, initial_balance)

    def __validator_lots(self, seed):
        lots = []
        for validator in self.balances.keys():
            stakes = int(self.balances[validator])
            for stake in range(stakes+1):
                lots.append(Lot(public_key=validator, iteration=stake+1, last_block_hash=seed))

        return lots

    def get_winner_staker(self, seed):
        lots = self.__validator_lots(seed=seed)
        winner_lot = None 
        least_offset = None 
        reference_hash_int = int(BlockchainUtils.hash(seed).hexdigest(), 16)
        for lot in lots:
            lot_hash_int = int(lot.lot_hash, 16)
            offset = abs(reference_hash_int - lot_hash_int)
            if (least_offset is None) or (offset < least_offset):
                least_offset = offset
                winner_lot = lot.public_key

        return winner_lot

