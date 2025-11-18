/**
 * Avatar configuration for react-native-avataaars
 * All options from the avataaars library
 */

export interface AvatarConfig {
  avatarStyle: 'Circle' | 'Transparent';
  topType: TopType;
  accessoriesType: AccessoriesType;
  hairColor: HairColor;
  facialHairType: FacialHairType;
  facialHairColor?: HairColor;
  clotheType: ClotheType;
  clotheColor: ClotheColor;
  eyeType: EyeType;
  eyebrowType: EyebrowType;
  mouthType: MouthType;
  skinColor: SkinColor;
}

export type TopType =
  | 'NoHair'
  | 'Eyepatch'
  | 'Hat'
  | 'Hijab'
  | 'Turban'
  | 'WinterHat1'
  | 'WinterHat2'
  | 'WinterHat3'
  | 'WinterHat4'
  | 'LongHairBigHair'
  | 'LongHairBob'
  | 'LongHairBun'
  | 'LongHairCurly'
  | 'LongHairCurvy'
  | 'LongHairDreads'
  | 'LongHairFrida'
  | 'LongHairFro'
  | 'LongHairFroBand'
  | 'LongHairNotTooLong'
  | 'LongHairShavedSides'
  | 'LongHairMiaWallace'
  | 'LongHairStraight'
  | 'LongHairStraight2'
  | 'LongHairStraightStrand'
  | 'ShortHairDreads01'
  | 'ShortHairDreads02'
  | 'ShortHairFrizzle'
  | 'ShortHairShaggyMullet'
  | 'ShortHairShortCurly'
  | 'ShortHairShortFlat'
  | 'ShortHairShortRound'
  | 'ShortHairShortWaved'
  | 'ShortHairSides'
  | 'ShortHairTheCaesar'
  | 'ShortHairTheCaesarSidePart';

export type AccessoriesType =
  | 'Blank'
  | 'Kurt'
  | 'Prescription01'
  | 'Prescription02'
  | 'Round'
  | 'Sunglasses'
  | 'Wayfarers';

export type HairColor =
  | 'Auburn'
  | 'Black'
  | 'Blonde'
  | 'BlondeGolden'
  | 'Brown'
  | 'BrownDark'
  | 'PastelPink'
  | 'Platinum'
  | 'Red'
  | 'SilverGray';

export type FacialHairType =
  | 'Blank'
  | 'BeardMedium'
  | 'BeardLight'
  | 'BeardMajestic'
  | 'MoustacheFancy'
  | 'MoustacheMagnum';

export type ClotheType =
  | 'BlazerShirt'
  | 'BlazerSweater'
  | 'CollarSweater'
  | 'GraphicShirt'
  | 'Hoodie'
  | 'Overall'
  | 'ShirtCrewNeck'
  | 'ShirtScoopNeck'
  | 'ShirtVNeck';

export type ClotheColor =
  | 'Black'
  | 'Blue01'
  | 'Blue02'
  | 'Blue03'
  | 'Gray01'
  | 'Gray02'
  | 'Heather'
  | 'PastelBlue'
  | 'PastelGreen'
  | 'PastelOrange'
  | 'PastelRed'
  | 'PastelYellow'
  | 'Pink'
  | 'Red'
  | 'White';

export type EyeType =
  | 'Close'
  | 'Cry'
  | 'Default'
  | 'Dizzy'
  | 'EyeRoll'
  | 'Happy'
  | 'Hearts'
  | 'Side'
  | 'Squint'
  | 'Surprised'
  | 'Wink'
  | 'WinkWacky';

export type EyebrowType =
  | 'Angry'
  | 'AngryNatural'
  | 'Default'
  | 'DefaultNatural'
  | 'FlatNatural'
  | 'RaisedExcited'
  | 'RaisedExcitedNatural'
  | 'SadConcerned'
  | 'SadConcernedNatural'
  | 'UnibrowNatural'
  | 'UpDown'
  | 'UpDownNatural';

export type MouthType =
  | 'Concerned'
  | 'Default'
  | 'Disbelief'
  | 'Eating'
  | 'Grimace'
  | 'Sad'
  | 'ScreamOpen'
  | 'Serious'
  | 'Smile'
  | 'Tongue'
  | 'Twinkle'
  | 'Vomit';

export type SkinColor =
  | 'Tanned'
  | 'Yellow'
  | 'Pale'
  | 'Light'
  | 'Brown'
  | 'DarkBrown'
  | 'Black';

/**
 * Default avatar configuration
 */
export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  avatarStyle: 'Circle',
  topType: 'ShortHairShortFlat',
  accessoriesType: 'Blank',
  hairColor: 'Brown',
  facialHairType: 'Blank',
  clotheType: 'Hoodie',
  clotheColor: 'Blue01',
  eyeType: 'Happy',
  eyebrowType: 'Default',
  mouthType: 'Smile',
  skinColor: 'Light',
};

/**
 * Age-appropriate avatar presets for kids
 */
export const KID_AVATAR_PRESETS: Record<string, AvatarConfig> = {
  boy1: {
    ...DEFAULT_AVATAR_CONFIG,
    topType: 'ShortHairShortFlat',
    hairColor: 'Brown',
    clotheType: 'Hoodie',
    clotheColor: 'Blue01',
    eyeType: 'Happy',
    mouthType: 'Smile',
  },
  boy2: {
    ...DEFAULT_AVATAR_CONFIG,
    topType: 'ShortHairShortCurly',
    hairColor: 'Black',
    clotheType: 'ShirtCrewNeck',
    clotheColor: 'Red',
    eyeType: 'Default',
    mouthType: 'Smile',
  },
  girl1: {
    ...DEFAULT_AVATAR_CONFIG,
    topType: 'LongHairStraight',
    hairColor: 'Blonde',
    clotheType: 'ShirtScoopNeck',
    clotheColor: 'Pink',
    eyeType: 'Happy',
    mouthType: 'Smile',
  },
  girl2: {
    ...DEFAULT_AVATAR_CONFIG,
    topType: 'LongHairBun',
    hairColor: 'BrownDark',
    clotheType: 'Overall',
    clotheColor: 'PastelBlue',
    eyeType: 'Happy',
    mouthType: 'Twinkle',
  },
};
