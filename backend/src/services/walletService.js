const AppError = require("../utils/AppError");
const User = require("../models/user/User");
const UserWallet = require("../models/user/UserWallet");
const WalletTransaction = require("../models/common/WalletTransaction");
const { getLowWalletAlertThreshold } = require("./configService");
const { createNotification } = require("./notificationService");

const toNumber = (value) => Number(value || 0);

const getUserWallet = async (ownerId, session = null) => {
  let wallet = await UserWallet.findOne({ user: ownerId }).session(
    session || null
  );

  if (!wallet) {
    const owner = await User.findById(ownerId).session(session || null);
    const seedBalance = toNumber(owner?.walletBalance);

    wallet = new UserWallet({
      user: ownerId,
      balance: seedBalance,
      availableBalance: seedBalance,
      totalCredited: seedBalance,
      totalDebited: 0,
      currency: "INR",
      status: "active",
    });

    await wallet.save({ session });
    return wallet;
  }

  return wallet;
};

const syncWalletBalances = async ({
  ownerId,
  nextBalance,
  creditDelta = null,
  debitDelta = null,
  session = null,
}) => {
  const owner = await User.findById(ownerId).session(session || null);
  if (!owner) {
    throw new AppError("Wallet owner not found", 404, "WALLET_OWNER_NOT_FOUND");
  }

  const wallet = await getUserWallet(ownerId, session);

  owner.walletBalance = nextBalance;
  await owner.save({ session });

  wallet.balance = nextBalance;
  wallet.availableBalance = nextBalance;
  if (Number.isFinite(creditDelta)) {
    wallet.totalCredited = Number(wallet.totalCredited || 0) + creditDelta;
  }
  if (Number.isFinite(debitDelta)) {
    wallet.totalDebited = Number(wallet.totalDebited || 0) + debitDelta;
  }
  await wallet.save({ session });

  return { owner, wallet };
};

const creditWallet = async ({
  ownerType,
  ownerId,
  amount,
  type,
  reference,
  meta = {},
  session = null,
}) => {
  if (ownerType !== "user") {
    throw new AppError(
      "Unsupported wallet owner type",
      400,
      "OWNER_TYPE_INVALID"
    );
  }

  const creditAmount = toNumber(amount);
  const owner = await User.findById(ownerId).session(session || null);
  if (!owner) {
    throw new AppError("Wallet owner not found", 404, "WALLET_OWNER_NOT_FOUND");
  }

  const wallet = await getUserWallet(ownerId, session);
  const currentBalance = Math.max(
    toNumber(owner.walletBalance),
    toNumber(wallet.availableBalance || wallet.balance)
  );
  const nextBalance = currentBalance + creditAmount;

  owner.walletBalance = nextBalance;
  wallet.balance = nextBalance;
  wallet.availableBalance = nextBalance;
  wallet.totalCredited = toNumber(wallet.totalCredited) + creditAmount;

  await owner.save({ session });
  await wallet.save({ session });

  await WalletTransaction.create(
    [
      {
        ownerType,
        owner: ownerId,
        amount: creditAmount,
        type,
        reference,
        meta,
        direction: "credit",
        balanceAfter: nextBalance,
      },
    ],
    { session }
  );

  return owner;
};

const debitWallet = async ({
  ownerType,
  ownerId,
  amount,
  type,
  reference,
  meta = {},
  session = null,
}) => {
  if (ownerType !== "user") {
    throw new AppError(
      "Unsupported wallet owner type",
      400,
      "OWNER_TYPE_INVALID"
    );
  }

  const debitAmount = toNumber(amount);
  const owner = await User.findById(ownerId).session(session || null);
  if (!owner) {
    throw new AppError("Wallet owner not found", 404, "WALLET_OWNER_NOT_FOUND");
  }

  const wallet = await getUserWallet(ownerId, session);
  const currentBalance = Math.max(
    toNumber(owner.walletBalance),
    toNumber(wallet.availableBalance || wallet.balance)
  );

  if (currentBalance < debitAmount) {
    throw new AppError("Insufficient wallet balance", 402, "INSUFFICIENT_BALANCE");
  }

  const previousBalance = currentBalance;
  const nextBalance = currentBalance - debitAmount;

  owner.walletBalance = nextBalance;
  wallet.balance = nextBalance;
  wallet.availableBalance = nextBalance;
  wallet.totalDebited = toNumber(wallet.totalDebited) + debitAmount;

  await owner.save({ session });
  await wallet.save({ session });

  await WalletTransaction.create(
    [
      {
        ownerType,
        owner: ownerId,
        amount: debitAmount,
        type,
        reference,
        meta,
        direction: "debit",
        balanceAfter: nextBalance,
      },
    ],
    { session }
  );

  const threshold = await getLowWalletAlertThreshold();
  if (previousBalance > threshold && nextBalance <= threshold) {
    await createNotification({
      recipientType: "user",
      recipient: ownerId,
      title: "Wallet balance is low",
      body: `Your wallet balance is now ${nextBalance}. Please recharge to continue services.`,
      type: "wallet",
      meta: { balance: nextBalance, threshold },
    });
  }

  return owner;
};

module.exports = { creditWallet, debitWallet, getUserWallet, syncWalletBalances };
