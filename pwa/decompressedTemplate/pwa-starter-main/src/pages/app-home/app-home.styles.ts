import { css } from 'lit';

// these styles can be imported from any component
// for an example of how to use this, check /pages/app-about/app-about.ts
export const homeStyles = css`
  #welcomeBar {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 16px;
  }

  #welcomeCard,
  #infoCard {
    padding: 18px;
    padding-top: 0px;
  }

  wa-card::part(footer) {
    display: flex;
    justify-content: flex-end;
  }

  @media(min-width: 750px) {
    wa-card {
      width: 70vw;
    }
  }


  @media (horizontal-viewport-segments: 2) {
    #welcomeBar {
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
    }

    #welcomeCard {
      margin-right: 64px;
    }
  }
`;
